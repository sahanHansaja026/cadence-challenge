
import type {
    Request,
    Response,
} from "express";
import { changePasswordSchema } from "../schemas/password.schema";
import { changeOwnPassword } from "../services/admin.password.service";






// ============================================
// CHANGE OWN PASSWORD
// PATCH /api/users/me/password
// ============================================

export async function changeOwnPasswordController(
    req: Request,
    res: Response,
): Promise<void> {

    /*
     * Authentication middleware should already
     * have populated req.user.
     */
    if (!req.user) {
        res.status(401).json({
            error: {
                message: "Authentication required.",
            },
        });

        return;
    }


    /*
     * Only COMPANY_ADMIN is allowed.
     */
    if (req.user.role !== "COMPANY_ADMIN") {
        res.status(403).json({
            error: {
                message:
                    "Only company admins can change their password.",
            },
        });

        return;
    }


    /*
     * Validate request body.
     */
    const parsed =
        changePasswordSchema.safeParse(
            req.body,
        );


    if (!parsed.success) {
        res.status(400).json({
            error: {
                message: "Invalid password data.",
                details: parsed.error.flatten(),
            },
        });

        return;
    }


    try {

        await changeOwnPassword(
            req.user.userId,
            req.user.companyId,
            parsed.data.currentPassword,
            parsed.data.newPassword,
        );


        res.status(200).json({
            data: {
                message:
                    "Password changed successfully.",
            },
        });

    } catch (error) {

        if (
            error instanceof Error &&
            error.message ===
                "INVALID_CURRENT_PASSWORD"
        ) {
            res.status(400).json({
                error: {
                    message:
                        "Current password is incorrect.",
                },
            });

            return;
        }


        if (
            error instanceof Error &&
            error.message ===
                "NEW_PASSWORD_MUST_BE_DIFFERENT"
        ) {
            res.status(400).json({
                error: {
                    message:
                        "New password must be different from the current password.",
                },
            });

            return;
        }


        if (
            error instanceof Error &&
            error.message ===
                "ONLY_COMPANY_ADMIN_CAN_CHANGE_PASSWORD"
        ) {
            res.status(403).json({
                error: {
                    message:
                        "Only company admins can change their password.",
                },
            });

            return;
        }


        if (
            error instanceof Error &&
            error.message === "USER_NOT_FOUND"
        ) {
            res.status(404).json({
                error: {
                    message: "User not found.",
                },
            });

            return;
        }


        console.error(
            "Change password error:",
            error,
        );


        res.status(500).json({
            error: {
                message:
                    "Failed to change password.",
            },
        });
    }
}

