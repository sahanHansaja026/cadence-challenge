import type {
    Request,
    Response,
} from "express";
import { createRefund, getRefundById, getRefunds, updateRefundStatus } from "../services/refund.service";
import { createRefundSchema, updateRefundStatusSchema } from "../schemas/refund.schema";




/*
 * GET /api/refunds
 *
 * COMPANY_ADMIN / FINANCE
 */
export async function getRefundsController(
    req: Request,
    res: Response,
): Promise<void> {

    if (!req.user) {
        res.status(401).json({
            error: {
                code: "UNAUTHORIZED",
                message:
                    "Authentication required.",
            },
        });

        return;
    }

    try {

        const refunds =
            await getRefunds(
                req.user.companyId,
            );

        res.status(200).json({
            data: {
                refunds,
            },
        });

    } catch (error: unknown) {

        console.error(
            "Get refunds error:",
            error,
        );

        res.status(500).json({
            error: {
                code:
                    "REFUNDS_FETCH_FAILED",
                message:
                    "Failed to load refunds.",
            },
        });
    }
}


/*
 * GET /api/refunds/:id
 */
export async function getRefundController(
    req: Request,
    res: Response,
): Promise<void> {

    if (!req.user) {
        res.status(401).json({
            error: {
                code: "UNAUTHORIZED",
                message:
                    "Authentication required.",
            },
        });

        return;
    }

    const refundId =
        req.params.id;

    if (
        typeof refundId !== "string" ||
        !refundId
    ) {
        res.status(400).json({
            error: {
                code: "REFUND_ID_REQUIRED",
                message:
                    "Refund ID is required.",
            },
        });

        return;
    }

    try {

        const refund =
            await getRefundById(
                req.user.companyId,
                refundId,
            );

        if (!refund) {
            res.status(404).json({
                error: {
                    code:
                        "REFUND_NOT_FOUND",
                    message:
                        "Refund not found.",
                },
            });

            return;
        }

        res.status(200).json({
            data: {
                refund,
            },
        });

    } catch (error: unknown) {

        console.error(
            "Get refund error:",
            error,
        );

        res.status(500).json({
            error: {
                code:
                    "REFUND_FETCH_FAILED",
                message:
                    "Failed to load refund.",
            },
        });
    }
}


/*
 * POST /api/refunds
 *
 * COMPANY_ADMIN / FINANCE
 */
export async function createRefundController(
    req: Request,
    res: Response,
): Promise<void> {

    if (!req.user) {
        res.status(401).json({
            error: {
                code: "UNAUTHORIZED",
                message:
                    "Authentication required.",
            },
        });

        return;
    }


    /*
     * Extra authorization protection.
     */
    if (
        req.user.role !==
        "COMPANY_ADMIN" &&
        req.user.role !==
        "FINANCE"
    ) {
        res.status(403).json({
            error: {
                code: "FORBIDDEN",
                message:
                    "You do not have permission to create refunds.",
            },
        });

        return;
    }


    const parsed =
        createRefundSchema.safeParse(
            req.body,
        );

    if (!parsed.success) {
        res.status(400).json({
            error: {
                code:
                    "VALIDATION_ERROR",
                message:
                    "Invalid refund data.",
                details:
                    parsed.error.flatten(),
            },
        });

        return;
    }


    try {

        const refund =
            await createRefund(
                req.user.companyId,
                req.user.userId,
                parsed.data,
            );

        res.status(201).json({
            data: {
                refund,
            },
        });

    } catch (error: unknown) {

        if (
            error instanceof Error &&
            error.message ===
            "BOOKING_NOT_FOUND"
        ) {
            res.status(404).json({
                error: {
                    code:
                        "BOOKING_NOT_FOUND",
                    message:
                        "Booking not found.",
                },
            });

            return;
        }


        if (
            error instanceof Error &&
            error.message ===
            "INVALID_REFUND_AMOUNT"
        ) {
            res.status(400).json({
                error: {
                    code:
                        "INVALID_REFUND_AMOUNT",
                    message:
                        "Refund amount must be greater than zero.",
                },
            });

            return;
        }


        if (
            error instanceof Error &&
            error.message ===
            "REFUND_AMOUNT_EXCEEDS_BOOKING"
        ) {
            res.status(400).json({
                error: {
                    code:
                        "REFUND_AMOUNT_EXCEEDS_BOOKING",
                    message:
                        "Total refunds cannot exceed the booking amount.",
                },
            });

            return;
        }


        console.error(
            "Create refund error:",
            error,
        );

        res.status(500).json({
            error: {
                code:
                    "REFUND_CREATE_FAILED",
                message:
                    "Failed to create refund.",
            },
        });
    }
}


/*
 * PATCH /api/refunds/:id/status
 *
 * COMPANY_ADMIN / FINANCE
 */
export async function updateRefundStatusController(
    req: Request,
    res: Response,
): Promise<void> {

    if (!req.user) {
        res.status(401).json({
            error: {
                code: "UNAUTHORIZED",
                message:
                    "Authentication required.",
            },
        });

        return;
    }


    /*
     * Extra authorization protection.
     */
    if (
        req.user.role !==
        "COMPANY_ADMIN" &&
        req.user.role !==
        "FINANCE"
    ) {
        res.status(403).json({
            error: {
                code: "FORBIDDEN",
                message:
                    "You do not have permission to update refunds.",
            },
        });

        return;
    }


    const refundId =
        req.params.id;

    if (
        typeof refundId !== "string" ||
        !refundId
    ) {
        res.status(400).json({
            error: {
                code:
                    "REFUND_ID_REQUIRED",
                message:
                    "Refund ID is required.",
            },
        });

        return;
    }


    const parsed =
        updateRefundStatusSchema.safeParse(
            req.body,
        );

    if (!parsed.success) {
        res.status(400).json({
            error: {
                code:
                    "VALIDATION_ERROR",
                message:
                    "Invalid refund status.",
                details:
                    parsed.error.flatten(),
            },
        });

        return;
    }


    try {

        const refund =
            await updateRefundStatus(
                req.user.companyId,
                refundId,
                parsed.data,
            );

        if (!refund) {
            res.status(404).json({
                error: {
                    code:
                        "REFUND_NOT_FOUND",
                    message:
                        "Refund not found.",
                },
            });

            return;
        }

        res.status(200).json({
            data: {
                refund,
            },
        });

    } catch (error: unknown) {

        if (
            error instanceof Error &&
            error.message ===
            "REFUND_ALREADY_CANCELLED"
        ) {
            res.status(409).json({
                error: {
                    code:
                        "REFUND_ALREADY_CANCELLED",
                    message:
                        "A cancelled refund cannot be changed.",
                },
            });

            return;
        }


        if (
            error instanceof Error &&
            error.message ===
            "REFUND_ALREADY_PROCESSED"
        ) {
            res.status(409).json({
                error: {
                    code:
                        "REFUND_ALREADY_PROCESSED",
                    message:
                        "A processed refund cannot be changed.",
                },
            });

            return;
        }


        console.error(
            "Update refund status error:",
            error,
        );

        res.status(500).json({
            error: {
                code:
                    "REFUND_UPDATE_FAILED",
                message:
                    "Failed to update refund.",
            },
        });
    }
}