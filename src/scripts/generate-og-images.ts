#!/usr/bin/env tsx

import path from "path";
import { generateOgImage } from "@utils/og";
import { extractPageMetadata } from "@utils/pages";
import fs from "fs/promises";

async function main() {
  const [,, contentSlug] = process.argv;

  if (!contentSlug) {
    console.error("❌ Content slug is required as argument.");
    process.exit(1);
  }

  const rootPath = path.resolve(__dirname, "..", "..");
  const imagesPath = path.join(rootPath, "public", "content");
  const fontsPath = path.join(rootPath, "public", "fonts");
  const contentPath = path.join(rootPath, "src", "data", "content");

  const pagePath = path.join(contentPath, contentSlug, "index.md");

  try {
    await fs.access(pagePath);
  } catch {
    console.error(`❌ Content file ${pagePath} not found.`);
    process.exit(1);
  }

  const ogPath = path.join(imagesPath, contentSlug, "og-image.png");
  const metadata = extractPageMetadata(pagePath);

  await generateOgImage(metadata, { output: ogPath, fonts: fontsPath });

  console.log(`✅ OG image generated for ${contentSlug}`);
}

main().catch(err => {
  console.error("Unexpected error:", err);
  process.exit(1);
});
