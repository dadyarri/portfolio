interface SiteConfig {
	author: string
	title: string
	description: string
	lang: string
	ogLocale: string
	paginationSize: number
}

export const siteConfig: SiteConfig = {
	author: 'dadyarri', // Site author
	title: 'dadyarri', // Site title.
	description: 'Личный сайт Даниила Голубева (a. k. a. dadyarri)', // Description to display in the meta tags
	lang: 'ru-RU',
	ogLocale: 'ru_RU',
	paginationSize: 6
}
