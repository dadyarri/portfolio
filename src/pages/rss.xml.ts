import rss from '@astrojs/rss';
import { getPosts } from '@utils/content';
import { splitArrayByElement, stripHtml } from '@utils/data';
import type { APIContext, AstroGlobal, AstroSharedContext } from 'astro';

export async function GET(context: APIContext) {
  return rss({
    title: 'Личный блог dadyarri',
    description: 'Опыт разработки, наблюдения и хобби',
    site: context.site!,
    items: (await getPosts()).map((post) => ({
        title: post.data.title,
        pubDate: post.data.date,
        description: stripHtml(splitArrayByElement(
            post.rendered?.html.split("\n")!,
            "<!--more-->",
        ).preview.join("")),
        link: `/posts/${post.id}`,
        author: "dadyarri"
    })),
    customData: `<language>ru-ru</language>`,
  });
}