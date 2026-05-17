import { z } from "zod";

// ── Generate SEO Report ────────────────────────────────

export const generateSeoReportSchema = z.object({
  auditId: z.string().min(1, "Audit ID is required"),
});

export type GenerateSeoReportInput = z.infer<typeof generateSeoReportSchema>;

// ── Generate Content Brief ─────────────────────────────

export const generateContentBriefSchema = z.object({
  keyword: z.string().min(1, "Keyword is required").max(200),
  secondaryKeywords: z.array(z.string()).max(10).optional(),
  competitorUrls: z.array(z.string().url()).max(5).optional(),
});

export type GenerateContentBriefInput = z.infer<typeof generateContentBriefSchema>;

// ── Content Optimization Score ─────────────────────────

export const scoreContentSchema = z.object({
  keyword: z.string().min(1, "Keyword is required").max(200),
  title: z.string().min(1, "Title is required").max(300),
  content: z.string().min(50, "Content must be at least 50 characters"),
  secondaryKeywords: z.array(z.string()).max(10).optional(),
});

export type ScoreContentInput = z.infer<typeof scoreContentSchema>;

// ── Competitor Analysis ────────────────────────────────

export const analyzeCompetitorsSchema = z.object({
  yourUrl: z.string().url("Your URL must be valid"),
  competitorUrls: z
    .array(z.string().url("Each competitor URL must be valid"))
    .min(1, "At least 1 competitor URL is required")
    .max(5, "Maximum 5 competitor URLs"),
});

export type AnalyzeCompetitorsInput = z.infer<typeof analyzeCompetitorsSchema>;

// ── Report History ─────────────────────────────────────

export const getReportHistorySchema = z.object({
  reportType: z.enum(["seo_report", "content_brief", "content_optimization", "competitor_analysis"]).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(10),
});

export type GetReportHistoryInput = z.infer<typeof getReportHistorySchema>;
