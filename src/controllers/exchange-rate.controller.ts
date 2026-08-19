import type {
    Request,
    Response,
} from "express";

import {
    createExchangeRateSchema,
} from "../schemas/exchange-rate.schema";

import {
    createExchangeRate,
    getExchangeRates,
} from "../services/exchange-rate.service";


/*
 * POST /api/exchange-rates
 *
 * FINANCE only
 */
export async function createExchangeRateController(
    req: Request,
    res: Response,
): Promise<void> {

    if (!req.user) {
        res.status(401).json({
            message: "Unauthorized",
        });
        return;
    }

    /*
     * Only FINANCE can create
     * exchange rates.
     */
    if (req.user.role !== "FINANCE") {
        res.status(403).json({
            message:
                "Only Finance can create exchange rates",
        });
        return;
    }

    const parsed =
        createExchangeRateSchema.safeParse(
            req.body,
        );

    if (!parsed.success) {
        res.status(400).json({
            message: "Invalid exchange rate",
            errors: parsed.error.flatten(),
        });
        return;
    }

    try {

        const rate =
            await createExchangeRate(
                parsed.data,
            );

        res.status(201).json(rate);

    } catch (error) {

        if (
            error instanceof Error &&
            error.message ===
            "EXCHANGE_RATE_ALREADY_EXISTS"
        ) {
            res.status(409).json({
                message:
                    "Exchange rate already exists for this currency and effective date.",
            });
            return;
        }

        res.status(500).json({
            message:
                "Failed to create exchange rate",
        });
    }
}


/*
 * GET /api/exchange-rates
 *
 * All authenticated users can view.
 *
 * FINANCE
 * COMPANY_ADMIN
 * AGENT
 */
export async function getExchangeRatesController(
    req: Request,
    res: Response,
): Promise<void> {

    if (!req.user) {
        res.status(401).json({
            message: "Unauthorized",
        });
        return;
    }

    try {

        const rates =
            await getExchangeRates();

        res.status(200).json(rates);

    } catch {

        res.status(500).json({
            message:
                "Failed to get exchange rates",
        });
    }
}