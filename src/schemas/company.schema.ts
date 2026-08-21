import { z } from "zod";

export const createCompanySchema = z.object({
    id: z.string().min(1),
    name: z.string().min(1),
});

export type CreateCompanyInput =
    z.infer<typeof createCompanySchema>;