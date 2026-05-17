import { z } from "zod";

export const updateProfileSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(50, "Name cannot exceed 50 characters")
    .trim()
    .optional(),
  avatar: z.string().url("Avatar must be a valid URL").optional(),
  timezone: z.string().optional(),
  locale: z.string().optional(),
});

export const notificationPrefsSchema = z.object({
  emailRankChanges: z.boolean().optional(),
  emailAuditComplete: z.boolean().optional(),
  emailWeeklyDigest: z.boolean().optional(),
  emailBacklinkAlerts: z.boolean().optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type NotificationPrefsInput = z.infer<typeof notificationPrefsSchema>;
