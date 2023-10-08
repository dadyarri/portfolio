import rss from '@astrojs/rss';

import { getCollection } from 'astro:content';

export async function GET(context) {
    const posts = await getCollection('posts');
    return rss({
        title: 'Личный блог dadyarri',
        description: 'Потоки мыслей на рандомные темы и околотехническая болтовня',
        site: context.site,
        items: posts.map(it => ({
            title: it.data.title,
            pubDate: it.data.publishedAt,
            description: it.data.description,
            link: `/posts/${it.slug}/`
        })),
        customData: `<language>ru-ru</language>`,
    });
}