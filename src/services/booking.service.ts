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
 * Import bookings from CSV rows.
 *
 * Responsibilities:
 *
 * 1. Validate CSV values.
 * 2. Verify that the agent exists and is active.
 * 3. Check for duplicate bookings.
 * 4. Insert valid bookings.
 *
 * companyId comes from the authenticated user's
 * company and is NOT taken from the CSV.
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

        /*
         * Use the original CSV row number
         * for error reporting.
         */
        const rowNumber =
            item.rowNumber;

        const row =
            item.data;


        /*
         * -----------------------------------------------------
         * CSV VALIDATION
         * -----------------------------------------------------
         *
         * This validation is pure and does not access
         * the database.
         */
        const validation =
            validateBookingRow(row);


        /*
         * Reject invalid CSV rows.
         */
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
         * -----------------------------------------------------
         * NORMALIZED VALUES
         * -----------------------------------------------------
         *
         * The validator has already:
         *
         * - trimmed values
         * - converted the date
         * - validated the amount
         * - normalized the product code
         */
        const bookingDate =
            validation.bookingDate!;

        const amount =
            validation.amount!;

        const productCode =
            validation.productCode!;


        /*
         * These values have already been validated,
         * but we still normalize them here for the
         * database operation.
         */
        const externalRef =
            row.external_ref
                ?.trim() ?? "";

        const agentCode =
            row.agent_code
                ?.trim() ?? "";


        /*
         * -----------------------------------------------------
         * AGENT CHECK
         * -----------------------------------------------------
         *
         * The agent must:
         *
         * 1. Belong to the authenticated user's company.
         * 2. Be ACTIVE.
         *
         * Agent matching is case-insensitive.
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


        /*
         * Agent does not exist or is inactive.
         */
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
         * -----------------------------------------------------
         * DUPLICATE CHECK
         * -----------------------------------------------------
         *
         * A booking reference is unique within a company.
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


        /*
         * Booking already exists.
         */
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
         * -----------------------------------------------------
         * INSERT BOOKING
         * -----------------------------------------------------
         *
         * companyId is taken from the authenticated request.
         *
         * It is NOT taken from the CSV.
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


        /*
         * Successfully inserted.
         */
        result.accepted++;
    }


    return result;
}