import { defineConfig, type AstroUserConfig } from 'astro/config';
import tailwind from "@astrojs/tailwind";
import icon from "astro-icon";
import mdx from "@astrojs/mdx";
import { SITE_URL } from './src/data/config';
import { remarkReadingTime } from './src/remark/reading-time';

// https://astro.build/config
export default defineConfig({
  integrations: [tailwind(), icon(), mdx()],
  site: SITE_URL,
  markdown: {
    syntaxHighlight: "shiki",
    shikiConfig: {
      wrap: true
    },
    remarkPlugins: [remarkReadingTime]
  }
} satisfies AstroUserConfig);