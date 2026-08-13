import { z } from "zod";

export const signupSchema = z.object({
    companyId: z.string().min(1),
    email: z.string().email(),
    password: z.string().min(8),
    role: z.enum([
        "COMPANY_ADMIN",
        "FINANCE",
        "AGENT",
    ]),
});

export const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(1),
});

export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;