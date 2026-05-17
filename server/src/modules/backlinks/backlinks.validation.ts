import { z } from "zod";

export const backlinkQuerySchema = z.object({
  domain: z.string().min(1, "Domain is required"),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  status: z.enum(["active", "lost", "new", "toxic", "disavowed"]).optional(),
  isDofollow: z.enum(["true", "false"]).optional(),
  sort: z.enum(["domainRank", "spamScore", "firstSeenAt", "toxicityScore"]).default("domainRank"),
  order: z.enum(["asc", "desc"]).default("desc"),
});

export const updateBacklinkSchema = z.object({
  disavowed: z.boolean().optional(),
  toxicityStatus: z.enum(["safe", "suspicious", "toxic"]).optional(),
});

export const competitorGapQuerySchema = z.object({
  domain: z.string().min(1, "Domain is required"),
  competitors: z.string().transform((val) => val.split(",").map((s) => s.trim()).filter(Boolean)),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

export const syncBacklinksSchema = z.object({
  domain: z.string().min(1, "Domain is required"),
});

export type BacklinkQuery = z.infer<typeof backlinkQuerySchema>;
export type UpdateBacklinkInput = z.infer<typeof updateBacklinkSchema>;
export type CompetitorGapQuery = z.infer<typeof competitorGapQuerySchema>;
export type SyncBacklinksInput = z.infer<typeof syncBacklinksSchema>;
