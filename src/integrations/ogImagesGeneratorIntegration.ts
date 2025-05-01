import type { AstroIntegration } from "astro";
import path from "node:path";
import { fileURLToPath } from "node:url";
export function ogImagesGeneratorIntegration(): AstroIntegration {
    return {
        name: "dadyarri-og-images-generator",
        hooks: {
            "astro:build:done": ({ dir, pages, logger }) => {
                const rootPath = fileURLToPath(new URL('..', dir));
                const coversPath = path.join(rootPath, "public", "content");
                const contentPath = path.join(rootPath, "src", "data", "content");

                function isInternalPage(url: string): boolean {
                    const regex = /\/?(cv|tags|series|\d+)(\/|$)/;
                    return regex.test(url);
                }

                pages
                    .filter(page =>
                        page.pathname !== "" &&
                        !isInternalPage(page.pathname)
                    )
                    .forEach(page => {
                        logger.info(`Generating og-image for ${page.pathname}...`);

                        const coverPath = path.join(coversPath, page.pathname, "cover.webp");
                        const pagePath = path.join(contentPath, page.pathname, "index.md");

                        

                    });
            }
        }
    }
}