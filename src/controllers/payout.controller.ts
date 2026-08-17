import type {
    Request,
    Response,
} from "express";

import {
    createPayoutRunSchema,
} from "../schemas/payout.schema";

import {
    createPayoutRun,
    getPayoutRunById,
    getPayoutRuns,
} from "../services/payout.service";


/*
 * CREATE PAYOUT RUN
 */
export async function createPayoutRunController(
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


    const parsed =
        createPayoutRunSchema.safeParse(
            req.body,
        );


    if (!parsed.success) {

        res.status(400).json({
            error: {
                code: "VALIDATION_ERROR",
                message:
                    "Invalid payout run data.",
                details:
                    parsed.error.issues.map(
                        (issue) => ({
                            field:
                                issue.path.join(
                                    ".",
                                ),
                            message:
                                issue.message,
                        }),
                    ),
            },
        });

        return;
    }


    try {

        const payoutRun =
            await createPayoutRun(
                req.user.companyId,
                parsed.data.periodStart,
                parsed.data.periodEnd,
            );


        res.status(201).json({
            data: {
                payoutRun,
            },
        });

    } catch (error: unknown) {

        console.error(
            "Create payout run error:",
            error,
        );


        if (
            error instanceof Error &&
            error.message ===
            "PAYOUT_RUN_ALREADY_EXISTS"
        ) {

            res.status(400).json({
                error: {
                    code:
                        "PAYOUT_RUN_ALREADY_EXISTS",
                    message:
                        "A payout run already exists for this period.",
                },
            });

            return;
        }


        if (
            error instanceof Error &&
            error.message ===
            "INVALID_PAYOUT_PERIOD"
        ) {

            res.status(400).json({
                error: {
                    code:
                        "INVALID_PAYOUT_PERIOD",
                    message:
                        "Period end must be on or after period start.",
                },
            });

            return;
        }


        res.status(500).json({
            error: {
                code:
                    "INTERNAL_SERVER_ERROR",
                message:
                    "Something went wrong.",
            },
        });
    }
}


/*
 * GET ALL PAYOUT RUNS
 */
export async function getPayoutRunsController(
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

        const payoutRuns =
            await getPayoutRuns(
                req.user.companyId,
            );


        res.status(200).json({
            data: {
                payoutRuns,
            },
        });

    } catch (error: unknown) {

        console.error(
            "Get payout runs error:",
            error,
        );


        res.status(500).json({
            error: {
                code:
                    "INTERNAL_SERVER_ERROR",
                message:
                    "Something went wrong.",
            },
        });
    }
}


/*
 * GET ONE PAYOUT RUN
 */
export async function getPayoutRunController(
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


    const payoutRunId =
        req.params.id;


    if (
        !payoutRunId ||
        Array.isArray(payoutRunId)
    ) {

        res.status(400).json({
            error: {
                code:
                    "INVALID_PAYOUT_RUN_ID",
                message:
                    "Invalid payout run ID.",
            },
        });

        return;
    }


    try {

        const payoutRun =
            await getPayoutRunById(
                payoutRunId,
                req.user.companyId,
            );


        if (!payoutRun) {

            res.status(404).json({
                error: {
                    code:
                        "PAYOUT_RUN_NOT_FOUND",
                    message:
                        "Payout run not found.",
                },
            });

            return;
        }


        res.status(200).json({
            data: {
                payoutRun,
            },
        });

    } catch (error: unknown) {

        console.error(
            "Get payout run error:",
            error,
        );


        res.status(500).json({
            error: {
                code:
                    "INTERNAL_SERVER_ERROR",
                message:
                    "Something went wrong.",
            },
        });
    }
}