import { z, defineCollection, reference } from 'astro:content';
import { glob } from 'astro/loaders';

const posts = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/data/content' }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    draft: z.boolean().default(false),
    tags: z.array(reference("tags")),
    series: reference("series").optional(),
    category: reference("categories").default("posts"),
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
    label: z.string()
  })
})

const tags = defineCollection({
  loader: glob({pattern: "**/[^_]*.json", base: "./src/data/tags"}),
  schema: z.object({
    label: z.string()
  })
})

export const collections = { posts, series, categories, tags };