import rss from '@astrojs/rss';
import { getMinis, getPosts } from '@utils/content';
import { splitArrayByElement, stripHtml } from '@utils/data';
import type { APIContext } from 'astro';

export async function GET(context: APIContext) {

  const posts = (await getPosts()).map(post => ({
    title: post.data.title,
    pubDate: post.data.date,
    description: stripHtml(splitArrayByElement(
      post.rendered?.html.split("\n")!,
      "<!--more-->",
    ).preview.join("")),
    link: `/posts/${post.id}`,
    author: "dadyarri"
  }));
  
  const minis = (await getMinis()).map(mini => ({
    title: mini.data.title,
    pubDate: mini.data.date,
    description: stripHtml(splitArrayByElement(
      mini.rendered?.html.split("\n")!,
      "<!--more-->",
    ).preview.join("")),
    link: `/minis/${mini.id}`,
    author: "dadyarri"
  }))

  const contentItems = posts.concat(minis).sort((a, b) => {
    const dateA = a.pubDate.valueOf();
    const dateB = b.pubDate.valueOf();

    return dateB - dateA;
  });

  return rss({
    title: 'Личный блог dadyarri',
    description: 'Опыт разработки, наблюдения и хобби',
    site: context.site!,
    items: contentItems,
    customData: `<language>ru-ru</language>`,
  });
}