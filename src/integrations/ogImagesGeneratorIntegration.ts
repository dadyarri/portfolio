import { generateOgImage } from "../utils/og";
import { formatDate } from "../utils/date";
import { extractPageMetadata } from "../utils/pages";
import type { AstroIntegration } from "astro";
import path from "node:path";
import { fileURLToPath } from "node:url";
export function ogImagesGeneratorIntegration(): AstroIntegration {
    return {
        name: "dadyarri-og-images-generator",
        hooks: {
            "astro:build:done": async ({ dir, pages }) => {
                const rootPath = fileURLToPath(new URL('..', dir));
                const imagesPath = path.join(rootPath, "public", "content");
                const fontsPath = path.join(rootPath, "public", "fonts");
                const contentPath = path.join(rootPath, "src", "data", "content");

                function isInternalPage(url: string): boolean {
                    const regex = /\/?(cv|tags|series|\d+)(\/|$)/;
                    return regex.test(url);
                }

                await Promise.all(
                    pages
                      .filter(page =>
                        page.pathname !== "" &&
                        !isInternalPage(page.pathname)
                      )
                      .map(async (page) => {
                        const coverPath = path.join(imagesPath, page.pathname, "cover.png");
                        const ogPath = path.join(imagesPath, page.pathname, "og-image.png");
                        const pagePath = path.join(contentPath, page.pathname, "index.md");
                  
                        const metadata = extractPageMetadata(pagePath);
                        await generateOgImage(metadata, { output: ogPath, fonts: fontsPath });
                      })
                  );
                  
            }
        }
    }
}