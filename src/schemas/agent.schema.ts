import { z } from "zod";

export const createAgentProfileSchema = z.object({
    agent_code: z
        .string()
        .trim()
        .min(1, "Agent code is required.")
        .max(50),

    full_name: z
        .string()
        .trim()
        .min(2, "Full name is required.")
        .max(255),
});

export const updateAgentProfileSchema = z.object({
    full_name: z
        .string()
        .trim()
        .min(2, "Full name is required.")
        .max(255),
});

export type CreateAgentProfileInput =
    z.infer<typeof createAgentProfileSchema>;

export type UpdateAgentProfileInput =
    z.infer<typeof updateAgentProfileSchema>;