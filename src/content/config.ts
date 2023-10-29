import { defineCollection, z } from "astro:content";

const postsCollection = defineCollection({
  type: "content",
  schema: z.object({
    title: z.string(),
    source: z.string().url().nullable().default(null),
    publishedAt: z.date(),
    description: z.string().default(""),
    isPublish: z.boolean(),
    isDraft: z.boolean().default(false),
    tags: z.array(z.string())
  }),
});

const projectsCollections = defineCollection({
  type: "content",
  schema: z.object({
    title: z.string(),
    description: z.string().default(""),
    subpage: z.boolean(),
    deprecated: z.boolean(),
    tags: z.array(z.string())
  })
})

export const collections = {
  posts: postsCollection,
  projects: projectsCollections,
};
