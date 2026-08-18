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

    if (req.user.role !== "FINANCE" &&
        req.user.role !== "COMPANY_ADMIN") {
        res.status(403).json({
            message: "Forbidden",
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
            message: "Failed to create exchange rate",
        });
    }
}


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
            message: "Failed to get exchange rates",
        });
    }
}