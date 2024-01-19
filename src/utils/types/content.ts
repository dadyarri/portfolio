export type Project = {
    slug?: string;
    title: string;
    description: string;
    tags: string[];
    subpage: boolean;
    deprecated: boolean;
};


export type Post = {
    title: string,
    publishedAt: Date,
    description: string,
    slug?: string,
    tags: string[]
};