import rss from '@astrojs/rss';

import { getCollection } from 'astro:content';
import type { APIContext } from 'astro';

export async function GET(context: APIContext) {
    const posts = (await getCollection('posts')).sort(
        (a, b) => b.data.publishedAt.getTime() - a.data.publishedAt.getTime(),
    );
    return rss({
        title: 'Даниил Голубев | Личный блог',
        description:
            'Потоки мыслей на рандомные темы и околотехническая болтовня',
        site: context.site!,
        items: posts
            .map((it) => ({
                title: it.data.title,
                pubDate: it.data.publishedAt,
                description: it.data.description,
                link: `/posts/${it.slug}/`,
                isPublish: it.data.published,
            }))
            .filter((it) => it.isPublish),
        customData: '<language>ru-ru</language>',
        stylesheet: '/assets/feed-style.xsl',
    });
}
