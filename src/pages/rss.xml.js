import rss from '@astrojs/rss';

import { getCollection } from 'astro:content';

import sanitizeHtml from 'sanitize-html';

import MarkdownIt from 'markdown-it';
const parser = new MarkdownIt();

export async function GET(context) {
    const posts = await getCollection('posts');
    return rss({
        title: 'Личный блог dadyarri',
        description: 'Потоки мыслей на рандомные темы и околотехническая болтовня',
        site: context.site,
        items: posts.map((it) => ({
            title: it.data.title,
            pubDate: it.data.publishedAt,
            description: it.data.description,
            link: `/posts/${it.slug}/`,
            content: sanitizeHtml(parser.render(it.body)),
        })),
        customData: '<language>ru-ru</language>',
        stylesheet: '/assets/feed-style.xsl',
    });
}