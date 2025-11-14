import type { AstroIntegration } from 'astro';
import { fileURLToPath } from 'node:url';
import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'path';
import * as cheerio from 'cheerio';

const copyIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-copy"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>`;

async function walkDir(dir: string, out: string[] = []): Promise<string[]> {
  try {
    const entries = await readdir(dir, { withFileTypes: true });
    for (const e of entries) {
      const full = path.join(dir, e.name);
      if (e.isDirectory()) await walkDir(full, out);
      else out.push(full);
    }
  } catch {
    // Directory doesn't exist or not accessible
  }
  return out;
}

function escapeHtml(str: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  };
  return str.replace(/[&<>"']/g, (s) => map[s] || s);
}

function transformHtml(html: string): string {
  const $ = cheerio.load(html);

  // Process code blocks: wrap pre > code in code-container with footer
  $('pre > code').each((_idx: number, el: any) => {
    const code = $(el);
    const pre = code.parent();

    // Check if already wrapped
    if (!pre.parent().hasClass('code-container')) {
      const lang = (pre.attr('data-language') || 'default').toUpperCase();
      const footer = `<div class="code-footer"><span class="code-label">${lang}</span><button class="clipboard-button" aria-label="Copy code to clipboard">${copyIcon}</button></div>`;

      pre.wrap('<div class="code-container"></div>');
      pre.after(footer);
    }
  });

  // Process images in paragraphs: convert p > img to div.image with hr and alt text
  $('p > img').each((_idx: number, el: any) => {
    const img = $(el);
    const parentP = img.parent();
    const alt = (img.attr('alt') || '').trim();

    // Preserve the img element
    const imgHtml = $.html(img);
    const hr = alt ? '<hr/>' : '';
    const altHtml = alt ? `<p>${escapeHtml(alt)}</p>` : '';
    const wrapper = `<div class="image">${imgHtml}${hr}${altHtml}</div>`;

    parentP.replaceWith(wrapper);
  });

  html = $.html();

  // Inject modal HTML once at the end if not already present
  if (!html.includes('id="image-modal"')) {
    const modal = `<div id="image-modal" class="image-modal" style="position:fixed;top:0;left:0;width:100%;height:100%;background-color:rgba(0,0,0,0.9);z-index:1000;display:none;align-items:center;justify-content:center;cursor:pointer;"><img id="modal-image" style="max-width:90%;max-height:90%;object-fit:contain;" alt=""></div>`;
    // Inject before closing body tag
    const bodyCloseIndex = html.lastIndexOf('</body>');
    if (bodyCloseIndex !== -1) {
      html = html.slice(0, bodyCloseIndex) + modal + html.slice(bodyCloseIndex);
    }
  }

  return html;
}

export default function staticCodeImages(): AstroIntegration {
  return {
    name: 'static-code-images',
    hooks: {
      'astro:server:setup': ({ server, logger }) => {
        // Dev mode: Add middleware to transform HTML responses
        server.middlewares.use((req: any, res: any, next: any) => {
          // Check if this is an HTML page request
          if (!req.url || req.url.includes('.') && !req.url.endsWith('.html')) {
            next();
            return;
          }

          const originalEnd = res.end;
          const originalWrite = res.write;
          let chunks: any[] = [];

          res.write = function (chunk: any, ...args: any[]) {
            chunks.push(chunk);
            return res;
          };

          res.end = function (chunk?: any, ...args: any[]) {
            if (chunk) chunks.push(chunk);
            const body = Buffer.concat(chunks.map((c: any) => Buffer.isBuffer(c) ? c : Buffer.from(c))).toString('utf-8');

            if (body.includes('</html>')) {
              try {
                const transformed = transformHtml(body);
                originalEnd.call(this, transformed, ...args);
              } catch (err) {
                logger.warn(`[static-code-images] transformation error: ${String(err)}`);
                originalEnd.call(this, body, ...args);
              }
            } else {
              originalEnd.call(this, chunk, ...args);
            }
          };

          next();
        });

        logger.info(`[static-code-images] dev middleware installed`);
      },

      'astro:build:done': async ({ dir, logger }) => {
        // Build mode: post-process all HTML files in dist to apply build-time transforms
        const outDir = fileURLToPath(dir);
        logger.info(`[static-code-images] processing ${outDir}`);

        const files = await walkDir(outDir);
        const htmlFiles = files.filter((f) => f.endsWith('.html'));

        for (const file of htmlFiles) {
          try {
            let html = await readFile(file, 'utf8');
            html = transformHtml(html);
            await writeFile(file, html, 'utf8');
            logger.debug(`[static-code-images] processed ${file}`);
          } catch (err) {
            logger.warn(`[static-code-images] failed to process ${file}: ${String(err)}`);
          }
        }

        logger.info(`[static-code-images] completed processing ${htmlFiles.length} HTML files`);
      },
    },
  };
}
