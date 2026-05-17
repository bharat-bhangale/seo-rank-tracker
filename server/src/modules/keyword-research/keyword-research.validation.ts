import { z } from "zod";

export const keywordIdeaQuerySchema = z.object({
  seed: z.string().min(1, "Seed keyword is required"),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

export const keywordGapQuerySchema = z.object({
  domain: z.string().min(1, "Domain is required"),
  competitors: z.string().transform((val) => val.split(",").map((s) => s.trim()).filter(Boolean)),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

export const generateClusterSchema = z.object({
  keywords: z.array(z.string()).min(3, "Provide at least 3 keywords for clustering").max(100),
});

export const getClustersSchema = z.object({
  websiteId: z.string().optional(),
});

export const visibilityScoreQuerySchema = z.object({
  domain: z.string().min(1, "Domain is required"),
});

export type KeywordIdeaQuery = z.infer<typeof keywordIdeaQuerySchema>;
export type KeywordGapQuery = z.infer<typeof keywordGapQuerySchema>;
export type GenerateClusterInput = z.infer<typeof generateClusterSchema>;
export type GetClustersQuery = z.infer<typeof getClustersSchema>;
export type VisibilityScoreQuery = z.infer<typeof visibilityScoreQuerySchema>;
