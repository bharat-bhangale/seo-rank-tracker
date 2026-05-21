import { z } from "zod";

export const generateBriefSchema = z.object({
  keyword: z.string().min(1, "Keyword is required").max(200),
  websiteId: z.string().optional(),
  targetUrl: z.string().url().optional(),
  locale: z.string().default("us"),
  language: z.string().default("en"),
});

export const scoreContentSchema = z.object({
  keyword: z.string().min(1, "Keyword is required").max(200),
  content: z.string().min(50, "Content must be at least 50 characters"),
  url: z.string().url().optional(),
});

export const getTopicClustersSchema = z.object({
  websiteId: z.string().min(1, "Website ID is required"),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(10),
});

export type GenerateBriefInput = z.infer<typeof generateBriefSchema>;
export type ScoreContentInput = z.infer<typeof scoreContentSchema>;
export type GetTopicClustersInput = z.infer<typeof getTopicClustersSchema>;
