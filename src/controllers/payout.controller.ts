import type {
    Request,
    Response,
} from "express";
import { createPayoutRunSchema } from "../schemas/payout.schema";
import { createPayoutRun, getPayoutRunById, getPayoutRuns } from "../services/payout.service";



// create payout
export async function createPayoutRunController(
    req: Request,
    res: Response,
): Promise<void> {

    if (!req.user) {
        res.status(401).json({
            error: {
                code: "UNAUTHORIZED",
                message: "Authentication required.",
            },
        });

        return;
    }

    const parsed =
        createPayoutRunSchema.safeParse(req.body);

    if (!parsed.success) {
        res.status(400).json({
            error: {
                code: "VALIDATION_ERROR",
                message: "Invalid request data.",
                details: parsed.error.issues.map(
                    (issue) => ({
                        field: issue.path.join("."),
                        message: issue.message,
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

        console.error(error);

        res.status(500).json({
            error: {
                code: "INTERNAL_SERVER_ERROR",
                message: "Something went wrong.",
            },
        });
    }
}

// get all payout
export async function getPayoutRunsController(
    req: Request,
    res: Response,
): Promise<void> {

    if (!req.user) {
        res.status(401).json({
            error: {
                code: "UNAUTHORIZED",
                message: "Authentication required.",
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

        console.error(error);

        res.status(500).json({
            error: {
                code: "INTERNAL_SERVER_ERROR",
                message: "Something went wrong.",
            },
        });
    }
}

// get payout by id
export async function getPayoutRunController(
    req: Request,
    res: Response,
): Promise<void> {

    if (!req.user) {
        res.status(401).json({
            error: {
                code: "UNAUTHORIZED",
                message: "Authentication required.",
            },
        });

        return;
    }

    const payoutRunId = req.params.id;

    if (
        !payoutRunId ||
        Array.isArray(payoutRunId)
    ) {
        res.status(400).json({
            error: {
                code: "INVALID_PAYOUT_RUN_ID",
                message: "Invalid payout run ID.",
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
                    code: "PAYOUT_RUN_NOT_FOUND",
                    message: "Payout run not found.",
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

        console.error(error);

        res.status(500).json({
            error: {
                code: "INTERNAL_SERVER_ERROR",
                message: "Something went wrong.",
            },
        });
    }
}