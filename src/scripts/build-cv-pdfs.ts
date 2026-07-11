import path from "node:path";
import { mkdir } from "node:fs/promises";
import { ensureDistExists, renderPdfRoute } from "./lib/pdf-renderer.ts";

const root = process.cwd();
const outputDir = path.join("public", "files");

async function main(): Promise<void> {
  await ensureDistExists();
  await mkdir(outputDir, { recursive: true });
  await renderPdfRoute({ route: "/cv/print", outputPath: path.join(outputDir, "cv.ru.pdf") });
  await renderPdfRoute({ route: "/en/cv/print", outputPath: path.join(outputDir, "cv.en.pdf") });

  console.log("Generated CV PDFs:");
  console.log(`- ${path.relative(root, path.join(outputDir, "cv.ru.pdf"))}`);
  console.log(`- ${path.relative(root, path.join(outputDir, "cv.en.pdf"))}`);
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Failed to generate CV PDFs: ${message}`);

  if (message.includes("Executable doesn't exist") || message.includes("browserType.launch")) {
    console.error("Install Playwright Chromium with: npx playwright install chromium");
  }

  process.exitCode = 1;
});
