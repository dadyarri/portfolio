import { createReadStream } from "node:fs";
import { access, mkdir, stat, writeFile } from "node:fs/promises";
import http from "node:http";
import path from "node:path";
import { chromium } from "playwright";

const root = process.cwd();
const distDir = path.join(root, "dist");
const host = "127.0.0.1";

const mimeTypes: Record<string, string> = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".jpg": "image/jpeg",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".txt": "text/plain; charset=utf-8",
  ".webp": "image/webp",
  ".xml": "application/xml; charset=utf-8",
};

function getContentType(filePath: string): string {
  return mimeTypes[path.extname(filePath).toLowerCase()] ?? "application/octet-stream";
}

function resolveDistPath(urlPath: string): string {
  const pathname = decodeURIComponent(new URL(urlPath, `http://${host}`).pathname);
  let relativePath = pathname.replace(/^\/+/, "");
  if (!relativePath) relativePath = "index.html";
  let filePath = path.join(distDir, relativePath);
  if (!path.extname(filePath)) filePath = path.join(filePath, "index.html");
  return filePath;
}

export async function ensureDistExists(): Promise<void> {
  try {
    await access(distDir);
  } catch {
    throw new Error("dist/ not found. Run astro build before generating PDFs.");
  }
}

async function startStaticServer(): Promise<{ port: number; close(): Promise<void> }> {
  const server = http.createServer(async (request, response) => {
    try {
      const filePath = resolveDistPath(request.url ?? "/");
      const fileInfo = await stat(filePath);
      if (!fileInfo.isFile()) {
        response.writeHead(404);
        response.end("Not found");
        return;
      }
      response.writeHead(200, { "Content-Type": getContentType(filePath) });
      createReadStream(filePath).pipe(response);
    } catch {
      response.writeHead(404);
      response.end("Not found");
    }
  });

  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, host, () => resolve());
  });

  const address = server.address();
  if (!address || typeof address === "string") {
    throw new Error("Failed to determine static server address");
  }

  return {
    port: address.port,
    async close() {
      await new Promise<void>((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
      });
    },
  };
}

export async function renderPdfRoute({
  route,
  outputPath,
  htmlOutputPath,
}: {
  route: string;
  outputPath: string;
  htmlOutputPath?: string;
}): Promise<void> {
  await ensureDistExists();
  await mkdir(path.dirname(outputPath), { recursive: true });

  const server = await startStaticServer();
  const baseUrl = `http://${host}:${server.port}`;
  const browser = await chromium.launch();

  try {
    const page = await browser.newPage();
    const response = await page.goto(`${baseUrl}${route}`, { waitUntil: "networkidle" });
    if (!response || !response.ok()) {
      throw new Error(`Route responded with ${response?.status() ?? "no response"} for ${route}`);
    }
    await page.emulateMedia({ media: "print" });

    if (htmlOutputPath) {
      await mkdir(path.dirname(htmlOutputPath), { recursive: true });
      await writeFile(htmlOutputPath, await page.content(), "utf8");
    }

    await page.pdf({
      path: outputPath,
      format: "A4",
      printBackground: true,
      displayHeaderFooter: false,
      margin: { top: "12mm", right: "12mm", bottom: "12mm", left: "12mm" },
    });
  } finally {
    await browser.close();
    await server.close();
  }
}
