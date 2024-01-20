export type Project = {
    slug?: string;
    title: string;
    description: string;
    deprecated?: boolean;
    tags: string[];
};

export type Post = {
    slug?: string;
    title: string;
    description: string;
    publishedAt?: Date;
    tags: string[];
};
