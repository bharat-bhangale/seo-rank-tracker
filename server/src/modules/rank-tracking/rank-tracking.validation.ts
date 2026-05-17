import { z } from "zod";

const objectIdSchema = z.string().regex(/^[a-f\d]{24}$/i, "Invalid ObjectId");

const scheduleSchema = z.object({
  enabled: z.boolean().default(true),
  cron: z.string().min(5, "Cron expression is required").default("0 3 * * *"),
  timezone: z.string().min(1).default("UTC"),
});

const geoTargetSchema = z.object({
  name: z.string().trim().optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  radiusKm: z.number().min(1).max(100).optional(),
  gridSize: z.number().int().min(3).max(9).optional(),
});

export const createKeywordSchema = z
  .object({
    websiteId: objectIdSchema.optional(),
    domain: z.string().trim().min(1).optional(),
    keyword: z.string().trim().min(1).max(250),
    searchEngine: z.enum(["google"]).default("google"),
    locale: z.string().trim().min(2).max(20).default("en-US"),
    device: z.enum(["desktop", "mobile"]).default("desktop"),
    group: z.string().trim().max(80).optional(),
    tags: z.array(z.string().trim().min(1).max(40)).max(20).default([]),
    competitors: z.array(z.string().trim().min(1)).max(20).default([]),
    status: z.enum(["active", "paused"]).default("active"),
    schedule: scheduleSchema.default({
      enabled: true,
      cron: "0 3 * * *",
      timezone: "UTC",
    }),
    geoTarget: geoTargetSchema.optional(),
  })
  .refine((value) => value.websiteId || value.domain, {
    message: "Either websiteId or domain is required.",
    path: ["domain"],
  });

export const updateKeywordSchema = z.object({
  domain: z.string().trim().min(1).optional(),
  keyword: z.string().trim().min(1).max(250).optional(),
  locale: z.string().trim().min(2).max(20).optional(),
  device: z.enum(["desktop", "mobile"]).optional(),
  group: z.string().trim().max(80).nullable().optional(),
  tags: z.array(z.string().trim().min(1).max(40)).max(20).optional(),
  competitors: z.array(z.string().trim().min(1)).max(20).optional(),
  status: z.enum(["active", "paused"]).optional(),
  schedule: scheduleSchema.partial().optional(),
  geoTarget: geoTargetSchema.nullable().optional(),
});

export const keywordListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(["active", "paused"]).optional(),
  domain: z.string().trim().optional(),
  search: z.string().trim().optional(),
  tag: z.string().trim().optional(),
});

export const trendQuerySchema = z.object({
  days: z.coerce.number().int().min(1).max(365).default(30),
});

export const alertQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  unreadOnly: z.coerce.boolean().default(false),
});

export const manualCheckSchema = z.object({
  location: geoTargetSchema.optional(),
});

export const bulkImportSchema = z.object({
  csvText: z.string().min(1, "CSV text is required"),
});

export const geoGridCheckSchema = z.object({
  center: z.object({
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
    name: z.string().trim().optional(),
  }),
  radiusKm: z.number().min(1).max(100).default(5),
  gridSize: z.number().int().min(3).max(9).default(3),
});

export type CreateKeywordInput = z.infer<typeof createKeywordSchema>;
export type UpdateKeywordInput = z.infer<typeof updateKeywordSchema>;
export type KeywordListQuery = z.infer<typeof keywordListQuerySchema>;
export type TrendQuery = z.infer<typeof trendQuerySchema>;
export type AlertQuery = z.infer<typeof alertQuerySchema>;
export type ManualCheckInput = z.infer<typeof manualCheckSchema>;
export type BulkImportInput = z.infer<typeof bulkImportSchema>;
export type GeoGridCheckInput = z.infer<typeof geoGridCheckSchema>;
