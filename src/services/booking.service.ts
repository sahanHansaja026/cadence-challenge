import { randomUUID } from "crypto";

import { query } from "../db/client";

import type {
    BookingImportRow,
} from "../controllers/booking.controller";

import {
    validateBookingRow,
} from "../validators/booking-import.validator";


interface ImportError {
    row: number;
    reason: string;
}


export interface ImportResult {
    accepted: number;
    rejected: number;
    duplicates: number;
    errors: ImportError[];
}


/*
 * ---------------------------------------------------------
 * GET EXCHANGE RATE
 * ---------------------------------------------------------
 *
 * Finds the latest rate effective on or before
 * the booking date.
 *
 * Example:
 *
 * Booking date = 2026-08-20
 *
 * Rates:
 *
 * 2026-08-01 = 318
 * 2026-08-15 = 320
 *
 * Result = 320
 */
async function getExchangeRate(
    currency: string,
    bookingDate: string,
): Promise<string | null> {

    /*
     * LKR does not need conversion.
     */
    if (currency === "LKR") {
        return "1";
    }

    const rows =
        await query<{
            rate_to_lkr: string;
        }>(
            `
            SELECT rate_to_lkr
            FROM exchange_rates
            WHERE currency = $1
              AND effective_from <= $2
            ORDER BY effective_from DESC
            LIMIT 1
            `,
            [
                currency,
                bookingDate,
            ],
        );

    return rows[0]?.rate_to_lkr ?? null;
}


/*
 * ---------------------------------------------------------
 * CONVERT TO LKR
 * ---------------------------------------------------------
 */
async function convertToLkr(
    amount: string,
    currency: string,
    bookingDate: string,
): Promise<{
    amountLkr: string;
    exchangeRate: string;
} | null> {

    const rate =
        await getExchangeRate(
            currency,
            bookingDate,
        );

    if (!rate) {
        return null;
    }

    /*
     * PostgreSQL NUMERIC is used so
     * we don't use JavaScript floating point
     * arithmetic for money.
     */
    const rows =
        await query<{
            amount_lkr: string;
        }>(
            `
            SELECT ROUND(
                $1::numeric *
                $2::numeric,
                2
            ) AS amount_lkr
            `,
            [
                amount,
                rate,
            ],
        );

    const amountLkr =
        rows[0]?.amount_lkr;

    if (amountLkr === undefined) {
        return null;
    }

    return {
        amountLkr,
        exchangeRate: rate,
    };
}


/*
 * ---------------------------------------------------------
 * IMPORT BOOKINGS
 * ---------------------------------------------------------
 */
export async function importBookings(
    companyId: string,
    rows: BookingImportRow[],
): Promise<ImportResult> {

    const result: ImportResult = {
        accepted: 0,
        rejected: 0,
        duplicates: 0,
        errors: [],
    };

    for (const item of rows) {

        const rowNumber =
            item.rowNumber;

        const row =
            item.data;


        /*
         * -------------------------------------------------
         * VALIDATION
         * -------------------------------------------------
         */
        const validation =
            validateBookingRow(row);

        if (!validation.valid) {

            result.rejected++;

            result.errors.push({
                row: rowNumber,
                reason:
                    validation.reason!,
            });

            continue;
        }


        /*
         * -------------------------------------------------
         * VALUES
         * -------------------------------------------------
         */
        const bookingDate =
            validation.bookingDate!;

        const originalCurrency =
            validation.currency!;

        const originalAmount =
            validation.originalAmount!;

        const productCode =
            validation.productCode!;

        const externalRef =
            row.external_ref?.trim() ?? "";

        const agentCode =
            row.agent_code?.trim() ?? "";


        /*
         * -------------------------------------------------
         * AGENT
         * -------------------------------------------------
         */
        const agents =
            await query<{
                id: string;
            }>(
                `
                SELECT id
                FROM agents
                WHERE company_id = $1
                  AND UPPER(agent_code) =
                      UPPER($2)
                  AND status = 'ACTIVE'
                LIMIT 1
                `,
                [
                    companyId,
                    agentCode,
                ],
            );

        if (agents.length === 0) {

            result.rejected++;

            result.errors.push({
                row: rowNumber,
                reason:
                    "Agent does not exist or is not active in this company.",
            });

            continue;
        }


        /*
         * -------------------------------------------------
         * DUPLICATE
         * -------------------------------------------------
         */
        const duplicate =
            await query<{
                id: string;
            }>(
                `
                SELECT id
                FROM bookings
                WHERE company_id = $1
                  AND external_ref = $2
                LIMIT 1
                `,
                [
                    companyId,
                    externalRef,
                ],
            );

        if (duplicate.length > 0) {

            result.duplicates++;

            result.errors.push({
                row: rowNumber,
                reason:
                    "Duplicate booking. This reference already exists.",
            });

            continue;
        }


        /*
         * -------------------------------------------------
         * EXCHANGE RATE
         * -------------------------------------------------
         *
         * For LKR:
         *
         * original amount = 10000
         * exchange rate   = 1
         * LKR amount      = 10000
         *
         *
         * For USD:
         *
         * original amount = 100
         * rate            = 318
         * LKR amount      = 31800
         */
        const conversion =
            await convertToLkr(
                originalAmount,
                originalCurrency,
                bookingDate,
            );


        /*
         * No applicable exchange rate.
         */
        if (!conversion) {

            result.rejected++;

            result.errors.push({
                row: rowNumber,
                reason:
                    `No exchange rate found for ${originalCurrency} on or before ${bookingDate}.`,
            });

            continue;
        }


        /*
         * -------------------------------------------------
         * INSERT BOOKING
         * -------------------------------------------------
         *
         * We store BOTH:
         *
         * original_amount
         * original_currency
         * exchange_rate
         *
         * AND:
         *
         * amount = converted LKR amount
         * currency = LKR
         *
         * This gives us a complete audit trail.
         */
        await query(
            `
            INSERT INTO bookings (
                id,
                company_id,
                external_ref,
                agent_code,
                booking_date,
                amount,
                currency,
                product_code,
                original_amount,
                original_currency,
                exchange_rate
            )
            VALUES (
                $1,
                $2,
                $3,
                $4,
                $5,
                $6,
                'LKR',
                $7,
                $8,
                $9,
                $10
            )
            `,
            [
                `booking_${randomUUID()}`,

                companyId,

                externalRef,

                agentCode.toUpperCase(),

                bookingDate,

                conversion.amountLkr,

                productCode,

                originalAmount,

                originalCurrency,

                conversion.exchangeRate,
            ],
        );


        result.accepted++;
    }

    return result;
}