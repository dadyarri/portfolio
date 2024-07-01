import rss from '@astrojs/rss'
import { siteConfig } from '@/site-config'
import { getPosts } from '@/utils'

export async function get() {
	const posts = (await getPosts()).filter((e) => e.data.category == 'Посты')
	return rss({
		title: siteConfig.title,
		description: siteConfig.description,
		site: import.meta.env.SITE,
		items: posts.map((post) => ({
			...post.data,
			link: `post/${post.slug}/`
		}))
	})
}
