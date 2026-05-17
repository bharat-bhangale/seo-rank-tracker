import { z } from "zod";

export const runAuditSchema = z.object({
  url: z
    .string()
    .url("Please enter a valid URL")
    .refine(
      (url) => url.startsWith("http://") || url.startsWith("https://"),
      "URL must start with http:// or https://"
    ),
  websiteId: z.string().optional(),
});

export const getAuditHistorySchema = z.object({
  url: z.string().url().optional(),
  websiteId: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(10),
});

export type RunAuditInput = z.infer<typeof runAuditSchema>;
export type GetAuditHistoryInput = z.infer<typeof getAuditHistorySchema>;
