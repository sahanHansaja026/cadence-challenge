import { z } from "zod";

export const createPayoutRunSchema = z.object({
    periodStart: z.string().date(),
    periodEnd: z.string().date(),
});

export type CreatePayoutRunInput =
    z.infer<typeof createPayoutRunSchema>;