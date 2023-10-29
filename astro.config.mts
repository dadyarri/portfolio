import { defineConfig } from "astro/config";
import tailwind from "@astrojs/tailwind";
import sitemap from "@astrojs/sitemap";
import { SITE_URL } from "./src/data/config";
import { remarkReadingTime } from "./reading-time.mjs";
import mdx from "@astrojs/mdx";

// https://astro.build/config
export default defineConfig({
  integrations: [tailwind(), sitemap(), mdx()],
  site: SITE_URL,
  markdown: {
    syntaxHighlight: "shiki",
    shikiConfig: {
      theme: "nord",
      wrap: false
    },
    remarkPlugins: [remarkReadingTime]
  }
});