import { defineConfig } from "astro/config";
import tailwind from "@astrojs/tailwind";
import sitemap from "@astrojs/sitemap";
import { SITE_URL } from "./src/data/config";
import { remarkReadingTime } from "./reading-time.mjs";

export default defineConfig({
  integrations: [tailwind(), sitemap()],
  site: SITE_URL,
  markdown: {
    syntaxHighlight: "shiki",
    shikiConfig: {
      theme: "nord",
      wrap: false,
    },
    remarkPlugins: [remarkReadingTime]
  },
});
