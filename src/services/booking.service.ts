import { randomUUID } from "crypto";

import { query } from "../db/client";
import { BookingImportRow } from "../controllers/booking.controller";
import { CsvBookingRow } from "../schemas/booking.schema";



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
 * Convert DD/MM/YYYY or D/M/YYYY
 * into PostgreSQL YYYY-MM-DD.
 */

function convertDate(
    value: string,
): string | null {

    const match =
        /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(
            value.trim(),
        );

    if (!match) {
        return null;
    }

    const day =
        Number(match[1]);

    const month =
        Number(match[2]);

    const year =
        Number(match[3]);

    /*
     * Basic range validation.
     */

    if (
        month < 1 ||
        month > 12 ||
        day < 1 ||
        day > 31
    ) {
        return null;
    }

    /*
     * JavaScript Date validation.
     *
     * This catches:
     *
     * 31/02/2026
     * 31/04/2026
     * etc.
     */

    const date =
        new Date(
            Date.UTC(
                year,
                month - 1,
                day,
            ),
        );

    if (
        date.getUTCFullYear() !== year ||
        date.getUTCMonth() !== month - 1 ||
        date.getUTCDate() !== day
    ) {
        return null;
    }

    return [
        String(year),

        String(month)
            .padStart(2, "0"),

        String(day)
            .padStart(2, "0"),
    ].join("-");
}

/*
 * Amount validation.
 *
 * Valid:
 *
 * 5000
 * 5000.5
 * 5000.50
 *
 * Invalid:
 *
 * -500
 * 0
 * 5000.123
 * Rs. 5000
 * USD 500
 * 5,000
 */

function isValidAmount(
    value: string,
): boolean {

    const amount =
        value.trim();

    if (
        !/^\d+(\.\d{1,2})?$/.test(
            amount,
        )
    ) {
        return false;
    }

    return Number(amount) > 0;
}

/*
 * Products currently supported
 * by Cadence.
 */

const allowedProducts =
    new Set([
        "TRAVEL",
        "VISA",
        "INSURANCE",
    ]);

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
     * Process each valid controller row.
     */

    for (const item of rows) {

        /*
         * IMPORTANT:
         *
         * Use the ORIGINAL CSV row number.
         *
         * Do NOT use index + 2 here.
         */

        const rowNumber =
            item.rowNumber;

        const row: CsvBookingRow =
            item.data;

        /*
         * Normalize values.
         */

        const externalRef =
            row.external_ref
                ?.trim() ?? "";

        const agentCode =
            row.agent_code
                ?.trim() ?? "";

        const date =
            row.date
                ?.trim() ?? "";

        const amount =
            row.amount
                ?.trim() ?? "";

        const productCode =
            row.product_code
                ?.trim()
                .toUpperCase() ?? "";

        /*
         * Validate reference.
         */

        if (!externalRef) {

            result.rejected++;

            result.errors.push({
                row: rowNumber,
                reason:
                    "Ref is required.",
            });

            continue;
        }

        /*
         * Validate agent.
         */

        if (!agentCode) {

            result.rejected++;

            result.errors.push({
                row: rowNumber,
                reason:
                    "Agent Code is required.",
            });

            continue;
        }

        /*
         * Validate date.
         */

        if (!date) {

            result.rejected++;

            result.errors.push({
                row: rowNumber,
                reason:
                    "Booking Date is required.",
            });

            continue;
        }

        const bookingDate =
            convertDate(date);

        if (!bookingDate) {

            result.rejected++;

            result.errors.push({
                row: rowNumber,
                reason:
                    "Date must be a valid date in DD/MM/YYYY format.",
            });

            continue;
        }

        /*
         * Validate amount.
         */

        if (!amount) {

            result.rejected++;

            result.errors.push({
                row: rowNumber,
                reason:
                    "Amount is required.",
            });

            continue;
        }

        if (!isValidAmount(amount)) {

            result.rejected++;

            result.errors.push({
                row: rowNumber,
                reason:
                    "Amount must be a positive number with maximum 2 decimal places.",
            });

            continue;
        }

        /*
         * Validate product.
         */

        if (!productCode) {

            result.rejected++;

            result.errors.push({
                row: rowNumber,
                reason:
                    "Product is required.",
            });

            continue;
        }

        if (
            !allowedProducts.has(
                productCode,
            )
        ) {

            result.rejected++;

            result.errors.push({
                row: rowNumber,
                reason:
                    `Product '${productCode}' is not supported.`,
            });

            continue;
        }

        /*
         * Check agent.
         *
         * Agent must:
         *
         * 1. Belong to this company.
         * 2. Be ACTIVE.
         *
         * Case-insensitive matching means:
         *
         * AG-002
         * ag-002
         *
         * are treated as the same agent.
         */

        const agent =
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

        if (agent.length === 0) {

            result.rejected++;

            result.errors.push({
                row: rowNumber,
                reason:
                    "Agent does not exist or is not active in this company.",
            });

            continue;
        }

        /*
         * Check duplicate booking.
         *
         * Unique by:
         *
         * company_id + external_ref
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
         * Insert booking.
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

                amount,

                productCode,
            ],
        );

        result.accepted++;
    }

    return result;
}