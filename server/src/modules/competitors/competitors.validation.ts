import { z } from "zod";

export const analyzeCompetitorsSchema = z.object({
  websiteId: z.string().min(1, "Website ID is required"),
  competitorDomains: z
    .array(z.string().min(1))
    .min(1, "At least one competitor domain is required")
    .max(5, "Maximum 5 competitor domains allowed"),
  analysisType: z
    .enum(["full", "content_gap", "keyword_gap", "backlink_gap"])
    .default("full"),
});

export const getCompetitorsSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(10),
});

export type AnalyzeCompetitorsInput = z.infer<typeof analyzeCompetitorsSchema>;
export type GetCompetitorsInput = z.infer<typeof getCompetitorsSchema>;
