import { defineConfig } from "astro/config";
import tailwind from "@astrojs/tailwind";
import sitemap from "@astrojs/sitemap";
import { SITE_URL } from "./src/data/config";
import { remarkReadingTime } from "./reading-time.mjs";
import mdx from "@astrojs/mdx";
import type { AstroUserConfig } from "astro";
import remarkCodeTitles from "remark-code-titles";

// https://astro.build/config
export default defineConfig({
  integrations: [tailwind(), sitemap(), mdx()],
  site: SITE_URL,
  markdown: {
    syntaxHighlight: "shiki",
    shikiConfig: {
      wrap: true
    },
    remarkPlugins: [remarkReadingTime, remarkCodeTitles]
  }
} as AstroUserConfig);