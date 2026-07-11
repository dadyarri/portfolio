import { config } from "@data/config.json";
import {
  getMinis,
  getMinisBySeries,
  getMinisByTag,
  getPosts,
  getPostsBySeries,
  getPostsByTag,
  getTags,
} from "@utils/content";
import { getWordDeclension } from "@utils/declension";
import { getCollection, type CollectionEntry } from "astro:content";

export type ContentCollection = "posts" | "minis";

type ContentEntryMap = {
  posts: CollectionEntry<"posts">;
  minis: CollectionEntry<"minis">;
};

type ContentFetcherMap = {
  [K in ContentCollection]: () => Promise<ContentEntryMap[K][]>;
};

type SeriesFetcherMap = {
  [K in ContentCollection]: (seriesId: string) => Promise<ContentEntryMap[K][]>;
};

type TagFetcherMap = {
  [K in ContentCollection]: (tagId: string) => Promise<ContentEntryMap[K][]>;
};

const contentFetchers: ContentFetcherMap = {
  posts: () => getPosts(),
  minis: () => getMinis(),
};

const seriesFetchers: SeriesFetcherMap = {
  posts: (seriesId: string) => getPostsBySeries(seriesId, "desc"),
  minis: (seriesId: string) => getMinisBySeries(seriesId, "desc"),
};

const tagFetchers: TagFetcherMap = {
  posts: (tagId: string) => getPostsByTag(tagId),
  minis: (tagId: string) => getMinisByTag(tagId),
};

const contentTitles: Record<ContentCollection, string> = {
  posts: "Посты",
  minis: "Шпаргалки",
};

const contentDeclensions: Record<ContentCollection, [string, string, string]> = {
  posts: ["пост", "поста", "постов"],
  minis: ["шпаргалка", "шпаргалки", "шпаргалок"],
};

export async function buildContentEntryStaticPaths<
  TCollection extends ContentCollection,
>(collection: TCollection) {
  const entries = await contentFetchers[collection]();

  return entries.map((entry) => ({
    params: { id: entry.id },
    props: entry,
  }));
}

export async function getFirstPageContent<TCollection extends ContentCollection>(
  collection: TCollection,
) {
  const entries = await contentFetchers[collection]();

  return {
    pagesAmount: Math.ceil(entries.length / config.pageSize),
    firstPageEntries: entries.slice(0, config.pageSize),
  };
}

export async function buildSeriesStaticPaths() {
  const series = await getCollection("series");

  return series.map((entry) => ({
    params: { id: entry.id },
    props: entry,
  }));
}

export async function buildTagStaticPaths() {
  const tags = await getTags();

  return tags.map((entry) => ({
    params: { id: entry.id },
    props: entry,
  }));
}

export async function getSeriesContent<TCollection extends ContentCollection>(
  collection: TCollection,
  seriesId: string,
) {
  return seriesFetchers[collection](seriesId);
}

export async function getTagContent<TCollection extends ContentCollection>(
  collection: TCollection,
  tagId: string,
) {
  return tagFetchers[collection](tagId);
}

export function getContentTitle(collection: ContentCollection): string {
  return contentTitles[collection];
}

export async function getTagIndexItems(collection: ContentCollection) {
  const tags = await getTags();

  return Promise.all(
    tags.map(async (tag) => {
      const entries = await getTagContent(collection, tag.id);

      return {
        href:
          collection === "posts"
            ? `/posts/tags/${tag.id}`
            : `/minis/tags/${tag.id}`,
        label: tag.data.label,
        countLabel: getWordDeclension(
          entries.length,
          contentDeclensions[collection],
        ),
      };
    }),
  );
}
