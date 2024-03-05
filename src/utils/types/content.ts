import type { AllowedId } from "@/data/tags";

export type Project = {
    slug?: string;
    title: string;
    description: string;
    deprecated?: boolean;
    tags: AllowedId[];
};

export type Post = {
    slug?: string;
    title: string;
    description: string;
    publishedAt?: Date;
    tags: AllowedId[];
};
