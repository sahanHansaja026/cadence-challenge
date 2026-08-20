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
 * Gets the latest exchange rate that was
 * effective on or before the booking date.
 *
 * Example:
 *
 * booking date = 2026-03-20
 *
 * It will find the most recent rate where:
 *
 * effective_from <= 2026-03-20
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


    /*
     * IMPORTANT:
     *
     * Do NOT use rows[0].rate_to_lkr
     * directly.
     *
     * rows[0] may be undefined.
     */
    const rate =
        rows[0]?.rate_to_lkr;


    if (rate === undefined) {
        return null;
    }


    return rate;
}


/*
 * ---------------------------------------------------------
 * CONVERT AMOUNT TO LKR
 * ---------------------------------------------------------
 *
 * Uses Decimal.js-style arithmetic through
 * PostgreSQL numeric operations.
 *
 * We let PostgreSQL perform the multiplication
 * because NUMERIC is exact.
 */
async function convertToLkr(
    amount: string,
    currency: string,
    bookingDate: string,
): Promise<string | null> {

    /*
     * Already LKR.
     */
    if (currency === "LKR") {
        return amount;
    }


    /*
     * Find exchange rate.
     */
    const rate =
        await getExchangeRate(
            currency,
            bookingDate,
        );


    if (!rate) {
        return null;
    }


    /*
     * PostgreSQL NUMERIC multiplication.
     *
     * ROUND(..., 2)
     *
     * because bookings.amount is
     * numeric(14,2).
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


    return (
        rows[0]?.amount_lkr ??
        null
    );
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


    /*
     * Process each CSV row.
     */
    for (const item of rows) {

        const rowNumber =
            item.rowNumber;

        const row =
            item.data;


        /*
         * -------------------------------------------------
         * CSV VALIDATION
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
         * NORMALIZED VALUES
         * -------------------------------------------------
         */
        const bookingDate =
            validation.bookingDate!;

        const currency =
            validation.currency!;

        const originalAmount =
            validation.originalAmount!;

        const productCode =
            validation.productCode!;


        const externalRef =
            row.external_ref
                ?.trim() ?? "";

        const agentCode =
            row.agent_code
                ?.trim() ?? "";


        /*
         * -------------------------------------------------
         * AGENT CHECK
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
         * DUPLICATE CHECK
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
         * CURRENCY CONVERSION
         * -------------------------------------------------
         *
         * LKR:
         *
         * 5000
         * ↓
         * 5000
         *
         *
         * USD:
         *
         * USD100
         * ↓
         * exchange rate
         * ↓
         * 32000 LKR
         */
        const amountLkr =
            await convertToLkr(
                originalAmount,
                currency,
                bookingDate,
            );


        /*
         * No exchange rate available.
         */
        if (!amountLkr) {

            result.rejected++;

            result.errors.push({
                row: rowNumber,
                reason:
                    `No exchange rate found for ${currency} on or before ${bookingDate}.`,
            });

            continue;
        }


        /*
         * -------------------------------------------------
         * INSERT
         * -------------------------------------------------
         *
         * IMPORTANT:
         *
         * amount = LKR amount
         * currency = LKR
         *
         * This keeps the bookings table
         * normalized to LKR.
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
                product_code
            )
            VALUES (
                $1,
                $2,
                $3,
                $4,
                $5,
                $6,
                'LKR',
                $7
            )
            `,
            [
                `booking_${randomUUID()}`,

                companyId,

                externalRef,

                agentCode.toUpperCase(),

                bookingDate,

                amountLkr,

                productCode,
            ],
        );


        result.accepted++;
    }


    return result;
}