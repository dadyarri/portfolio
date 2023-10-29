import rss from '@astrojs/rss';

import { getCollection } from 'astro:content';

import sanitizeHtml from 'sanitize-html';

import MarkdownIt from 'markdown-it';
import type { APIContext } from 'astro';
const parser = new MarkdownIt();

export async function GET(context: APIContext) {
    const posts = (await getCollection('posts'))
        .sort((a, b) => b.data.publishedAt.getTime() - a.data.publishedAt.getTime());
    return rss({
        title: 'Личный блог dadyarri',
        description: 'Потоки мыслей на рандомные темы и околотехническая болтовня',
        site: context.site!,
        items: posts.map((it) => ({
            title: it.data.title,
            pubDate: it.data.publishedAt,
            description: it.data.description,
            link: `/posts/${it.slug}/`,
            content: sanitizeHtml(parser.render(it.body)),
            isPublish: it.data.isPublish
        })).filter(it => it.isPublish),
        customData: '<language>ru-ru</language>',
        stylesheet: '/assets/feed-style.xsl',
    });
}