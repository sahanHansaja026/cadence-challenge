import { z } from "zod";

export const createTeamSchema = z.object({
    name: z
        .string()
        .trim()
        .min(1, "Team name is required")
        .max(100, "Team name must be less than 100 characters"),

    leadAgentId: z
        .string()
        .min(1, "Team lead is required"),

    memberAgentIds: z
        .array(z.string().min(1))
        .min(1, "At least one team member is required"),
});

export const updateTeamSchema = z.object({
    name: z
        .string()
        .trim()
        .min(1, "Team name is required")
        .max(100, "Team name must be less than 100 characters")
        .optional(),

    leadAgentId: z
        .string()
        .min(1, "Team lead is required")
        .optional(),

    memberAgentIds: z
        .array(z.string().min(1))
        .min(1, "At least one team member is required")
        .optional(),
});

export type CreateTeamInput = z.infer<typeof createTeamSchema>;
export type UpdateTeamInput = z.infer<typeof updateTeamSchema>;