import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";
const common = z.object({
  format: z.enum(["markdown", "html"]).default("markdown"),
  title: z.string(),
  description: z.string(),
  seoTitle: z.string().optional(),
  path: z.string().optional(),
});
export const collections = {
  marketing: defineCollection({
    loader: glob({ pattern: "**/*.md", base: "./src/content/marketing" }),
    schema: common,
  }),
  pages: defineCollection({
    loader: glob({ pattern: "**/*.md", base: "./src/content/pages" }),
    schema: common.extend({ path: z.string() }),
  }),
  manual: defineCollection({
    loader: glob({ pattern: "**/*.md", base: "./src/content/manual" }),
    schema: common.extend({ order: z.number(), path: z.string() }),
  }),
  news: defineCollection({
    loader: glob({ pattern: "**/*.md", base: "./src/content/news" }),
    schema: z.object({
      title: z.string(),
      date: z.coerce.date(),
      author: z.string().default("Omarchy"),
      author_url: z.string().optional(),
      description: z.string().optional(),
    }),
  }),
};
