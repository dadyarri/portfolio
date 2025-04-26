// @ts-check
import { defineConfig } from 'astro/config';

import icon from 'astro-icon';

import netlify from '@astrojs/netlify';

import { remarkReadingTime } from './src/remark/reading-time.mjs';

import mdx from "@astrojs/mdx";

// https://astro.build/config
export default defineConfig({
  site: "https://dadyarri.ru",
  integrations: [icon(), mdx()],
  adapter: netlify(),
  markdown: {
    remarkPlugins: [remarkReadingTime],
    shikiConfig: {
      theme: "tokyo-night"
    }
  },
  redirects: {
    "/posts": "/posts/1",
    "/minis": "/minis/1"
  }
});