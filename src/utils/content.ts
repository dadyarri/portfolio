import {
    getCollection,
    getEntry,
    type CollectionEntry,
} from "astro:content";

type SortOrder = "asc" | "desc";
type ContentCollection = "posts" | "minis";

type CollectionEntryMap = {
    posts: CollectionEntry<"posts">;
    minis: CollectionEntry<"minis">;
};

const compareByDate =
    (order: SortOrder) =>
    (
        a: CollectionEntry<ContentCollection>,
        b: CollectionEntry<ContentCollection>,
    ) => {
        const direction = order === "asc" ? 1 : -1;
        return (a.data.date.valueOf() - b.data.date.valueOf()) * direction;
    };

const getSortedContentEntries = async <TCollection extends ContentCollection>(
    collection: TCollection,
    order: SortOrder = "desc",
): Promise<CollectionEntryMap[TCollection][]> => {
    const entries = await getCollection(collection);

    return entries
        .filter((entry) => import.meta.env.DEV || !entry.data.draft)
        .sort(compareByDate(order)) as CollectionEntryMap[TCollection][];
};

const filterEntriesByTag = <
    TEntry extends CollectionEntry<ContentCollection>,
>(
    entries: TEntry[],
    tag: string,
): TEntry[] => {
    const lowercaseTag = tag.toLowerCase();

    return entries.filter((entry) =>
        entry.data.tags.some((entryTag) => entryTag.id === lowercaseTag),
    );
};

const filterEntriesBySeries = <
    TEntry extends CollectionEntry<ContentCollection>,
>(
    entries: TEntry[],
    series: string,
): TEntry[] => {
    return entries.filter((entry) => entry.data.series?.id === series);
};

const getLabelMap = async <TCollection extends "tags" | "series">(
    collection: TCollection,
): Promise<Map<string, string>> => {
    const entries = await getCollection(collection);

    return new Map(
        entries.map((entry) => [entry.id, entry.data.label] satisfies [string, string]),
    );
};

const getTagLabelsForEntry = async (
    collection: ContentCollection,
    postId: string,
): Promise<string[]> => {
    const post = await getEntry(collection, postId);
    const tags = post?.data.tags ?? [];

    if (tags.length === 0) {
        return [];
    }

    const tagLabelMap = await getLabelMap("tags");

    return tags
        .map((tag) => tagLabelMap.get(tag.id))
        .filter((label): label is string => Boolean(label));
};

export const getPosts = async (
    order: SortOrder = "desc",
): Promise<CollectionEntry<"posts">[]> => {
    return getSortedContentEntries("posts", order);
};

export const getMinis = async (
    order: SortOrder = "desc",
): Promise<CollectionEntry<"minis">[]> => {
    return getSortedContentEntries("minis", order);
};

export const getPostsByTag = async (
    tag: string,
): Promise<CollectionEntry<"posts">[]> => {
    return filterEntriesByTag(await getPosts(), tag);
};

export const getMinisByTag = async (
    tag: string,
): Promise<CollectionEntry<"minis">[]> => {
    return filterEntriesByTag(await getMinis(), tag);
};

export const getTagLabel = async (id: string): Promise<string | undefined> => {
    return (await getLabelMap("tags")).get(id);
};

export const getTags = async () => {
    return getCollection("tags");
};

export const getSeriesLabel = async (
    id: string,
): Promise<string | undefined> => {
    return (await getLabelMap("series")).get(id);
};

export const getPostsBySeries = async (
    series: string,
    order: SortOrder = "asc",
): Promise<CollectionEntry<"posts">[]> => {
    return filterEntriesBySeries(await getPosts(order), series);
};

export const getMinisBySeries = async (
    series: string,
    order: SortOrder = "asc",
): Promise<CollectionEntry<"minis">[]> => {
    return filterEntriesBySeries(await getMinis(order), series);
};

export const getTagLabelsForPost = async (
    postId: string,
): Promise<string[]> => {
    return getTagLabelsForEntry("posts", postId);
};

export const getTagLabelsForMini = async (
    postId: string,
): Promise<string[]> => {
    return getTagLabelsForEntry("minis", postId);
};
