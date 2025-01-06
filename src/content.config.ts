import { z, defineCollection, reference } from 'astro:content';
import { glob } from 'astro/loaders';

const posts = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/data/posts' }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    draft: z.boolean().default(false),
    tags: z.array(z.string()),
    series: reference("series").optional()
  }),
});

const series = defineCollection({
  loader: glob({pattern: "**/[^_]*.json", base: "./src/data/series"}),
  schema: z.object({
    label: z.string()
  })
})

// Expose your defined collection to Astro
// with the `collections` export
export const collections = { posts, series};