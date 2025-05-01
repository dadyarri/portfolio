import type { AstroIntegration } from "astro";
import path from "node:path";
import { fileURLToPath } from "node:url";
export function ogImagesGeneratorIntegration(): AstroIntegration {
    return {
        name: "dadyarri-og-images-generator",
        hooks: {
            "astro:build:done": ({ dir, pages, logger }) => {
                const rootPath = fileURLToPath(new URL('..', dir));
                const publicPath = path.join(rootPath, "public");
                logger.info(rootPath);
                logger.info(publicPath);
                pages.forEach(page => {
                    if (page.pathname.startsWith("posts") || page.pathname.startsWith("minis")) {
                        logger.info(page.pathname);
                    }
                });
            }
        }
    }
}