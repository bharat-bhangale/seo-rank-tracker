import { z } from "zod";

const objectIdSchema = z.string().regex(/^[a-f\d]{24}$/i, "Invalid ObjectId");

export const gscAuthUrlSchema = z.object({
  redirectUri: z.string().url().optional(),
});

export const connectGscPropertySchema = z.object({
  code: z.string().min(1, "OAuth code is required"),
  siteUrl: z.string().min(1, "Search Console siteUrl is required"),
  websiteId: objectIdSchema.optional(),
  redirectUri: z.string().url().optional(),
});

export const syncGscPropertySchema = z.object({
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

export const performanceQuerySchema = z.object({
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  query: z.string().trim().optional(),
  page: z.string().trim().optional(),
  country: z.string().trim().optional(),
  device: z.string().trim().optional(),
  limit: z.coerce.number().int().min(1).max(1000).default(100),
});

export type GscAuthUrlInput = z.infer<typeof gscAuthUrlSchema>;
export type ConnectGscPropertyInput = z.infer<typeof connectGscPropertySchema>;
export type SyncGscPropertyInput = z.infer<typeof syncGscPropertySchema>;
export type PerformanceQuery = z.infer<typeof performanceQuerySchema>;
