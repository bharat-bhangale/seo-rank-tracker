import { z } from "zod";

export const createProjectSchema = z.object({
  name: z
    .string()
    .min(1, "Project name is required")
    .max(100, "Project name cannot exceed 100 characters")
    .trim(),
});

export const updateProjectSchema = z.object({
  name: z
    .string()
    .min(1, "Project name is required")
    .max(100, "Project name cannot exceed 100 characters")
    .trim()
    .optional(),
  isArchived: z.boolean().optional(),
});

export const inviteMemberSchema = z.object({
  email: z.string().email("Invalid email address").toLowerCase().trim(),
  role: z.enum(["editor", "viewer"], {
    errorMap: () => ({ message: "Role must be 'editor' or 'viewer'" }),
  }),
});

export const updateMemberRoleSchema = z.object({
  role: z.enum(["editor", "viewer"], {
    errorMap: () => ({ message: "Role must be 'editor' or 'viewer'" }),
  }),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
export type InviteMemberInput = z.infer<typeof inviteMemberSchema>;
export type UpdateMemberRoleInput = z.infer<typeof updateMemberRoleSchema>;
