import { getCollection, type CollectionEntry } from 'astro:content'

type SortOrder = 'asc' | 'desc';

export const getPosts = async (order: SortOrder = 'desc'): Promise<CollectionEntry<'posts'>[]> => {
	let posts = await getCollection('posts');

	if (posts === undefined) {
		posts = [];
	}

	const sortedPosts = posts
		.filter((post) => import.meta.env.DEV || !post.data.draft)
		.sort((a, b) => {
			const dateA = a.data.date.valueOf();
			const dateB = b.data.date.valueOf();

			if (order === 'asc') {
				return dateA - dateB;
			} else {
				return dateB - dateA;
			}
		});

	return sortedPosts;
};

export const getMinis = async (order: SortOrder = 'desc'): Promise<CollectionEntry<'minis'>[]> => {
	let minis = await getCollection('minis')

	if (minis === undefined) {
		minis = []
	}

	return minis
		.filter((post) => import.meta.env.DEV || !post.data.draft)
		.sort((a, b) => {
			const dateA = a.data.date.valueOf();
			const dateB = b.data.date.valueOf();

			if (order === 'asc') {
				return dateA - dateB;
			} else {
				return dateB - dateA;
			}
		})
}

export const getPostsByTag = async (tag: string): Promise<CollectionEntry<'posts'>[]> => {
	const posts = await getPosts()
	const lowercaseTag = tag.toLowerCase()
	return posts.filter((post) => {
		return post.data.tags.some((postTag) => postTag.id === lowercaseTag)
	})
}

export const getMinisByTag = async (tag: string): Promise<CollectionEntry<'minis'>[]> => {
	const posts = await getMinis()
	const lowercaseTag = tag.toLowerCase()
	return posts.filter((post) => {
		return post.data.tags.some((postTag) => postTag.id === lowercaseTag)
	})
}

export const getTagLabel = async (id: string) => {
	const tags = await getCollection("tags");
	return tags.find(tag => tag.id === id)?.data.label
}

export const getTags = async () => {
	const tags = await getCollection("tags");
	return tags;
}

export const getSeriesLabel = async (id: string) => {
	const series = await getCollection("series");
	return series.find(s => s.id === id)?.data.label
}

export const getPostsBySeries = async (series: string) => {
	const posts = await getPosts('asc')
	return posts
		.filter((post) => post.data.series?.id === series);
}

export const getMinisBySeries = async (series: string) => {
	const posts = await getMinis('asc')
	return posts
		.filter((post) => post.data.series?.id === series);
}