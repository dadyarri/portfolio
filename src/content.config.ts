import { z, defineCollection, reference } from 'astro:content';
import { glob } from 'astro/loaders';

const posts = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/data/content/posts' }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    draft: z.boolean().default(false),
    tags: z.array(reference("tags")),
    series: reference("series").optional(),
  }),
});

const minis = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/data/content/minis' }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    draft: z.boolean().default(false),
    tags: z.array(reference("tags")),
    series: reference("series").optional(),
  }),
});

const series = defineCollection({
  loader: glob({pattern: "**/[^_]*.json", base: "./src/data/series"}),
  schema: z.object({
    label: z.string()
  })
})

const categories = defineCollection({
  loader: glob({pattern: "**/[^_]*.json", base: "./src/data/categories"}),
  schema: z.object({
    order: z.number(),
    label: z.string()
  })
})

const tags = defineCollection({
  loader: glob({pattern: "**/[^_]*.json", base: "./src/data/tags"}),
  schema: z.object({
    label: z.string()
  })
})

export const collections = { posts, minis, series, categories, tags };