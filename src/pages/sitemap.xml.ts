import { config } from "@data/config.json";
import { getCollection } from "astro:content";
import { getMinis, getPosts, getTags } from "@utils/content";
import { getAbsoluteSiteUrl } from "@utils/seo";

type SitemapEntry = {
  loc: string;
  lastmod?: string;
};

function toSitemapUrl(entry: SitemapEntry): string {
  const lastmod = entry.lastmod ? `<lastmod>${entry.lastmod}</lastmod>` : "";

  return `<url><loc>${entry.loc}</loc>${lastmod}</url>`;
}

function getPaginatedPaths(basePath: string, totalEntries: number): string[] {
  const totalPages = Math.ceil(totalEntries / config.pageSize);

  if (totalPages <= 1) {
    return [];
  }

  return Array.from({ length: totalPages - 1 }, (_, index) =>
    getAbsoluteSiteUrl(`${basePath}/${index + 2}`),
  );
}

export async function GET(): Promise<Response> {
  const [posts, minis, tags, series] = await Promise.all([
    getPosts(),
    getMinis(),
    getTags(),
    getCollection("series"),
  ]);

  const entries: SitemapEntry[] = [
    { loc: getAbsoluteSiteUrl("/") },
    { loc: getAbsoluteSiteUrl("/posts") },
    { loc: getAbsoluteSiteUrl("/minis") },
    { loc: getAbsoluteSiteUrl("/posts/tags") },
    { loc: getAbsoluteSiteUrl("/minis/tags") },
    { loc: getAbsoluteSiteUrl("/cv") },
    { loc: getAbsoluteSiteUrl("/en/cv") },
    ...getPaginatedPaths("/posts", posts.length).map((loc) => ({ loc })),
    ...getPaginatedPaths("/minis", minis.length).map((loc) => ({ loc })),
    ...posts.map((post) => ({
      loc: getAbsoluteSiteUrl(`/posts/${post.id}`),
      lastmod: post.data.date.toISOString(),
    })),
    ...minis.map((mini) => ({
      loc: getAbsoluteSiteUrl(`/minis/${mini.id}`),
      lastmod: mini.data.date.toISOString(),
    })),
    ...tags.flatMap((tag) => [
      { loc: getAbsoluteSiteUrl(`/posts/tags/${tag.id}`) },
      { loc: getAbsoluteSiteUrl(`/minis/tags/${tag.id}`) },
    ]),
    ...series.flatMap((entry) => [
      { loc: getAbsoluteSiteUrl(`/posts/series/${entry.id}`) },
      { loc: getAbsoluteSiteUrl(`/minis/series/${entry.id}`) },
    ]),
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.map(toSitemapUrl).join("\n")}
</urlset>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
    },
  });
}
