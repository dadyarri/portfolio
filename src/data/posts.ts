export type Post = {
    title: string,
    publishedAt: Date,
    description: string,
    slug?: string,
    tags: string[]
};