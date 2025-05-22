import { getCollection, getEntry, type CollectionEntry } from 'astro:content'

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

export const getPostsBySeries = async (series: string, order: SortOrder = 'asc') => {
	const posts = await getPosts(order)
	return posts
		.filter((post) => post.data.series?.id === series);
}

export const getMinisBySeries = async (series: string, order: SortOrder = 'asc') => {
	const posts = await getMinis(order)
	return posts
		.filter((post) => post.data.series?.id === series);
}

export const getTagLabelsForPost = async (postId: string): Promise<string[]> => {
  const post = await getEntry("posts", postId);
  const tags = post?.data.tags;

  if (!tags) {
    return [];
  }

  const tagLabels = await Promise.all(
    tags.map(async (tag) => {
      // Assuming getTagLabel returns string | undefined, handle that:
      const label = await getTagLabel(tag.id);
      return label ?? ""; // or filter out undefined later
    })
  );

  // Optionally filter out empty strings if you don't want them:
  return tagLabels.filter((label) => label !== "");
};

export const getTagLabelsForMini = async (postId: string): Promise<string[]> => {
  const mini = await getEntry("minis", postId);
  const tags = mini?.data.tags;

  if (!tags) {
    return [];
  }

  const tagLabels = await Promise.all(
    tags.map(async (tag) => {
      const label = await getTagLabel(tag.id);
      return label ?? "";
    })
  );

  return tagLabels.filter((label) => label !== "");
};
