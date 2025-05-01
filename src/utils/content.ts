import { getCollection, type CollectionEntry } from 'astro:content'

export const getPosts = async (): Promise<CollectionEntry<'posts'>[]> => {
	let posts = await getCollection('posts')

	if (posts === undefined) {
		posts = []
	}

	return posts
		.filter((post) => import.meta.env.DEV || !post.data.draft)
		.sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf())
}

export const getMinis = async (): Promise<CollectionEntry<'minis'>[]> => {
	let minis = await getCollection('minis')

	if (minis === undefined) {
		minis = []
	}

	return minis
		.filter((post) => import.meta.env.DEV || !post.data.draft)
		.sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf())
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
	const posts = await getPosts()
	return posts
	.filter((post) => post.data.series?.id === series);
}

export const getMinisBySeries = async (series: string) => {
	const posts = await getMinis()
	return posts
	.filter((post) => post.data.series?.id === series);
}