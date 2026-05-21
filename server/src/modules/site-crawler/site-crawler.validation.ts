import { z } from "zod";

export const startCrawlSchema = z.object({
  websiteId: z.string().min(1, "Website ID is required"),
  maxDepth: z.coerce.number().int().min(1).max(10).default(3),
  maxPages: z.coerce.number().int().min(1).max(100_000).default(100),
  respectRobotsTxt: z.boolean().default(true),
  includeSubdomains: z.boolean().default(false),
});

export const getCrawlSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export const getCrawlPagesSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(50),
  statusCode: z.coerce.number().int().optional(),
  hasIssues: z
    .string()
    .transform((val) => val === "true")
    .optional(),
});

export type StartCrawlInput = z.infer<typeof startCrawlSchema>;
export type GetCrawlInput = z.infer<typeof getCrawlSchema>;
export type GetCrawlPagesInput = z.infer<typeof getCrawlPagesSchema>;
