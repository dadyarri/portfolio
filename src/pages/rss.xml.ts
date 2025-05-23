import rss, { type RSSFeedItem } from '@astrojs/rss';
import { getMinis, getPosts, getTagLabelsForPost } from '@utils/content';
import { splitArrayByElement, stripHtml } from '@utils/data';
import type { APIContext } from 'astro';

export async function GET(context: APIContext) {

  const posts: RSSFeedItem[] = await Promise.all(
  (await getPosts()).map(async (post) => ({
    title: post.data.title,
    pubDate: post.data.date,
    description: stripHtml(
      splitArrayByElement(post.rendered?.html.split("\n")!, "<!--more-->").preview.join("")
    ),
    link: `/posts/${post.id}`,
    author: "dadyarri",
    categories: await getTagLabelsForPost(post.id),
  }))
);

const minis: RSSFeedItem[] = await Promise.all(
  (await getMinis()).map(async (mini) => ({
    title: mini.data.title,
    pubDate: mini.data.date,
    description: stripHtml(
      splitArrayByElement(mini.rendered?.html.split("\n")!, "<!--more-->").preview.join("")
    ),
    link: `/minis/${mini.id}`,
    author: "dadyarri",
    categories: await getTagLabelsForPost(mini.id),
  }))
);

const contentItems: RSSFeedItem[] = posts.concat(minis).sort((a, b) => {
  const dateA = new Date(a.pubDate!).valueOf();
  const dateB = new Date(b.pubDate!).valueOf();

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