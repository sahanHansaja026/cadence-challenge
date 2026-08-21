// for admin password change only

import { z } from "zod";

export const changePasswordSchema = z.object({
    currentPassword: z
        .string()
        .min(1, "Current password is required."),

    newPassword: z
        .string()
        .min(8, "New password must be at least 8 characters.")
        .max(100, "New password is too long."),
});

export type ChangePasswordInput =
    z.infer<typeof changePasswordSchema>;
