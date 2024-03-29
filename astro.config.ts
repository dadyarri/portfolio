import { defineConfig, type AstroUserConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import icon from 'astro-icon';
import mdx from '@astrojs/mdx';
import { SITE_URL } from './src/data/config';
import { remarkReadingTime } from './src/remark/reading-time';
import { pluginCollapsibleSections } from '@expressive-code/plugin-collapsible-sections';
import expressiveCode from 'astro-expressive-code';

import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
    integrations: [
        tailwind(),
        icon(),
        expressiveCode({
            plugins: [pluginCollapsibleSections()],
        }),
        mdx(),
        sitemap(),
    ],
    site: SITE_URL,
    markdown: {
        syntaxHighlight: 'shiki',
        shikiConfig: {
            wrap: true,
        },
        remarkPlugins: [remarkReadingTime],
    },
    vite: {
        optimizeDeps: {
            exclude: ['sharp'],
        },
    },
} satisfies AstroUserConfig);
