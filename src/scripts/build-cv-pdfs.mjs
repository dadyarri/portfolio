import { createReadStream } from "node:fs";
import { access, mkdir, stat } from "node:fs/promises";
import http from "node:http";
import path from "node:path";
import { chromium } from "playwright";

const root = process.cwd();
const distDir = path.join(root, "dist");
const outputDir = path.join("public", "files");
const host = "127.0.0.1";

const mimeTypes = {
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

function getContentType(filePath) {
  return mimeTypes[path.extname(filePath).toLowerCase()] ?? "application/octet-stream";
}

function resolveDistPath(urlPath) {
  const pathname = decodeURIComponent(new URL(urlPath, `http://${host}`).pathname);
  let relativePath = pathname.replace(/^\/+/, "");

  if (!relativePath) {
    relativePath = "index.html";
  }

  let filePath = path.join(distDir, relativePath);

  if (!path.extname(filePath)) {
    filePath = path.join(filePath, "index.html");
  }

  return filePath;
}

async function startStaticServer() {
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

  await new Promise((resolve, reject) => {
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
      await new Promise((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
      });
    },
  };
}

async function ensureDistExists() {
  try {
    await access(distDir);
  } catch {
    throw new Error("dist/ not found. Run astro build before generating PDFs.");
  }
}

async function renderPdf(page, baseUrl, route, outputPath) {
  await page.goto(`${baseUrl}${route}`, { waitUntil: "networkidle" });
  await page.emulateMedia({ media: "print" });
  await page.pdf({
    path: outputPath,
    format: "A4",
    printBackground: true,
    displayHeaderFooter: false,
    margin: {
      top: "12mm",
      right: "12mm",
      bottom: "12mm",
      left: "12mm",
    },
  });
}

async function main() {
  await ensureDistExists();
  await mkdir(outputDir, { recursive: true });

  const server = await startStaticServer();
  const baseUrl = `http://${host}:${server.port}`;
  const browser = await chromium.launch();

  try {
    const page = await browser.newPage();

    await renderPdf(page, baseUrl, "/cv/print", path.join(outputDir, "cv.ru.pdf"));
    await renderPdf(page, baseUrl, "/en/cv/print", path.join(outputDir, "cv.en.pdf"));

    console.log("Generated CV PDFs:");
    console.log(`- ${path.relative(root, path.join(outputDir, "cv.ru.pdf"))}`);
    console.log(`- ${path.relative(root, path.join(outputDir, "cv.en.pdf"))}`);
  } finally {
    await browser.close();
    await server.close();
  }
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Failed to generate CV PDFs: ${message}`);

  if (message.includes("Executable doesn't exist") || message.includes("browserType.launch")) {
    console.error("Install Playwright Chromium with: npx playwright install chromium");
  }

  process.exitCode = 1;
});
