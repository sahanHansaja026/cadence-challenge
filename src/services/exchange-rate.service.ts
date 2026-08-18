import { randomUUID } from "crypto";
import { query } from "../db/client";

export interface ExchangeRate {
    id: string;
    effective_from: string;
    currency: string;
    rate_to_lkr: string;
    source: string;
    created_at: string;
}

export async function createExchangeRate(
    input: {
        effectiveFrom: string;
        currency: string;
        rateToLkr: string;
        source: string;
    },
): Promise<ExchangeRate> {

    const existing = await query<{ id: string }>(
        `
        SELECT id
        FROM exchange_rates
        WHERE effective_from = $1
          AND currency = $2
        `,
        [
            input.effectiveFrom,
            input.currency,
        ],
    );

    if (existing.length > 0) {
        throw new Error("EXCHANGE_RATE_ALREADY_EXISTS");
    }

    const result = await query<ExchangeRate>(
        `
        INSERT INTO exchange_rates (
            id,
            effective_from,
            currency,
            rate_to_lkr,
            source
        )
        VALUES ($1, $2, $3, $4, $5)
        RETURNING
            id,
            effective_from,
            currency,
            rate_to_lkr,
            source,
            created_at
        `,
        [
            `exchange_rate_${randomUUID()}`,
            input.effectiveFrom,
            input.currency,
            input.rateToLkr,
            input.source,
        ],
    );

    const rate = result[0];

    if (!rate) {
        throw new Error("EXCHANGE_RATE_CREATION_FAILED");
    }

    return rate;
}


export async function getExchangeRates(): Promise<ExchangeRate[]> {

    return await query<ExchangeRate>(
        `
        SELECT
            id,
            effective_from,
            currency,
            rate_to_lkr,
            source,
            created_at
        FROM exchange_rates
        ORDER BY
            effective_from DESC,
            currency ASC
        `,
    );
}


/*
 * Find the rate applicable on a booking date.
 *
 * Example:
 *
 * Booking date: 2026-02-20
 *
 * Available:
 * 2026-02-16 -> 317.80
 * 2026-02-23 -> 316.95
 *
 * Returns:
 * 2026-02-16 -> 317.80
 */
export async function getExchangeRateForDate(
    currency: string,
    bookingDate: string,
): Promise<ExchangeRate | null> {

    if (currency === "LKR") {
        return null;
    }

    const result = await query<ExchangeRate>(
        `
        SELECT
            id,
            effective_from,
            currency,
            rate_to_lkr,
            source,
            created_at
        FROM exchange_rates
        WHERE currency = $1
          AND effective_from <= $2::date
        ORDER BY
            effective_from DESC
        LIMIT 1
        `,
        [
            currency,
            bookingDate,
        ],
    );

    return result[0] ?? null;
}