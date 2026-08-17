import { randomUUID } from "crypto";

import { query } from "../db/client";


interface PayoutRun {
    id: string;
    company_id: string;
    run_no: number;
    period_start: string;
    period_end: string;
    status: "DRAFT" | "FINALISED";
    total_amount: string;
    created_at: string;
}


interface PayoutLineItem {
    id: string;
    payout_run_id: string;
    agent_code: string;
    booking_count: number;
    gross_volume: string;
    commission_rate: string;
    commission_amount: string;
}


/*
 * CREATE PAYOUT RUN
 *
 * 1. Create payout run
 * 2. Find active bookings in the period
 * 3. Find matching commission rules
 * 4. Calculate commission
 * 5. Create payout line items
 * 6. Update total payout amount
 */
export async function createPayoutRun(
    companyId: string,
    periodStart: string,
    periodEnd: string,
): Promise<PayoutRun> {

    /*
     * Validate payout period.
     */
    if (periodEnd < periodStart) {
        throw new Error(
            "INVALID_PAYOUT_PERIOD",
        );
    }


    /*
     * Get next run number.
     */
    const runNumberResult =
        await query<{
            next_run_no: number;
        }>(
            `
            SELECT
                COALESCE(
                    MAX(run_no),
                    0
                ) + 1 AS next_run_no
            FROM payout_runs
            WHERE company_id = $1
            `,
            [
                companyId,
            ],
        );


    const runNo =
        Number(
            runNumberResult[0]?.next_run_no ?? 1,
        );


    /*
     * Generate payout run ID.
     */
    const payoutRunId =
        `run_${randomUUID()}`;


    /*
     * Create payout run.
     */
    const payoutRuns =
        await query<PayoutRun>(
            `
            INSERT INTO payout_runs (
                id,
                company_id,
                run_no,
                period_start,
                period_end,
                status,
                total_amount
            )
            VALUES (
                $1,
                $2,
                $3,
                $4,
                $5,
                'DRAFT',
                0
            )
            RETURNING
                id,
                company_id,
                run_no,
                period_start,
                period_end,
                status,
                total_amount,
                created_at
            `,
            [
                payoutRunId,
                companyId,
                runNo,
                periodStart,
                periodEnd,
            ],
        );


    const payoutRun =
        payoutRuns[0];


    if (!payoutRun) {
        throw new Error(
            "PAYOUT_RUN_CREATION_FAILED",
        );
    }


    /*
     * Get active bookings
     * inside payout period.
     */
    const bookings =
        await query<{
            agent_code: string;
            product_code: string;
            booking_count: number;
            gross_volume: string;
        }>(
            `
            SELECT
                agent_code,
                product_code,

                COUNT(*)::integer
                    AS booking_count,

                COALESCE(
                    SUM(amount),
                    0
                )::numeric
                    AS gross_volume

            FROM bookings

            WHERE company_id = $1

              AND booking_date >= $2::date

              AND booking_date <= $3::date

              AND status = 'ACTIVE'

            GROUP BY
                agent_code,
                product_code

            ORDER BY
                agent_code
            `,
            [
                companyId,
                periodStart,
                periodEnd,
            ],
        );


    /*
     * No bookings.
     *
     * The payout run is still valid.
     * Its total remains 0.
     */
    if (bookings.length === 0) {
        return payoutRun;
    }


    let totalCommission = 0;


    /*
     * Process every
     * agent/product group.
     */
    for (const booking of bookings) {

        const grossVolume =
            Number(
                booking.gross_volume,
            );


        /*
         * Find matching commission rule.
         *
         * Product-specific rule has priority.
         *
         * Generic rule:
         * product_code IS NULL
         */
        const rules =
            await query<{
                id: string;
                commission_rate: string;
            }>(
                `
                SELECT
                    id,
                    commission_rate

                FROM commission_rules

                WHERE company_id = $1

                  AND effective_from <= $2::date

                  AND (
                        effective_to IS NULL
                        OR effective_to >= $3::date
                  )

                  AND min_amount <= $4::numeric

                  AND (
                        max_amount IS NULL
                        OR max_amount >= $4::numeric
                  )

                  AND (
                        product_code = $5
                        OR product_code IS NULL
                  )

                ORDER BY

                    CASE
                        WHEN product_code = $5
                        THEN 0
                        ELSE 1
                    END,

                    CASE
                        WHEN max_amount IS NULL
                        THEN 999999999999
                        ELSE max_amount
                    END

                LIMIT 1
                `,
                [
                    companyId,
                    periodStart,
                    periodEnd,
                    grossVolume,
                    booking.product_code,
                ],
            );


        /*
         * No matching commission rule.
         *
         * Skip this booking group.
         */
        const matchingRule =
            rules[0];


        if (!matchingRule) {
            continue;
        }


        /*
         * Commission percentage.
         */
        const commissionRate =
            Number(
                matchingRule.commission_rate,
            );


        /*
         * Calculate commission.
         *
         * Example:
         *
         * Gross volume = 100000
         * Rate = 5
         *
         * Commission =
         * 100000 * 5 / 100
         *
         * = 5000
         */
        const commissionAmount =
            Number(
                (
                    grossVolume *
                    commissionRate /
                    100
                ).toFixed(2),
            );


        totalCommission +=
            commissionAmount;


        /*
         * Check whether this agent
         * already has a payout line.
         */
        const existingLine =
            await query<{
                id: string;
                booking_count: number;
                gross_volume: string;
                commission_amount: string;
            }>(
                `
                SELECT
                    id,
                    booking_count,
                    gross_volume,
                    commission_amount

                FROM payout_line_items

                WHERE payout_run_id = $1
                  AND agent_code = $2

                LIMIT 1
                `,
                [
                    payoutRunId,
                    booking.agent_code,
                ],
            );


        /*
         * Get existing line safely.
         *
         * This avoids:
         *
         * Object is possibly 'undefined'
         */
        const currentLine =
            existingLine[0];


        /*
         * Existing agent line.
         */
        if (currentLine) {

            await query(
                `
                UPDATE payout_line_items

                SET
                    booking_count =
                        booking_count + $1,

                    gross_volume =
                        gross_volume + $2,

                    commission_amount =
                        commission_amount + $3,

                    commission_rate = $4

                WHERE id = $5
                `,
                [
                    booking.booking_count,
                    grossVolume,
                    commissionAmount,
                    commissionRate,
                    currentLine.id,
                ],
            );

        }

        /*
         * First line for this agent.
         */
        else {

            const lineId =
                `payout_line_${randomUUID()}`;


            await query(
                `
                INSERT INTO payout_line_items (
                    id,
                    payout_run_id,
                    agent_code,
                    booking_count,
                    gross_volume,
                    commission_rate,
                    commission_amount
                )

                VALUES (
                    $1,
                    $2,
                    $3,
                    $4,
                    $5,
                    $6,
                    $7
                )
                `,
                [
                    lineId,
                    payoutRunId,
                    booking.agent_code,
                    booking.booking_count,
                    grossVolume,
                    commissionRate,
                    commissionAmount,
                ],
            );
        }
    }


    /*
     * Update payout total.
     */
    const updatedRuns =
        await query<PayoutRun>(
            `
            UPDATE payout_runs

            SET
                total_amount = $1

            WHERE id = $2
              AND company_id = $3

            RETURNING
                id,
                company_id,
                run_no,
                period_start,
                period_end,
                status,
                total_amount,
                created_at
            `,
            [
                totalCommission.toFixed(2),
                payoutRunId,
                companyId,
            ],
        );


    const updatedRun =
        updatedRuns[0];


    if (!updatedRun) {
        throw new Error(
            "PAYOUT_RUN_UPDATE_FAILED",
        );
    }


    return updatedRun;
}


/*
 * GET ALL PAYOUT RUNS
 */
export async function getPayoutRuns(
    companyId: string,
): Promise<PayoutRun[]> {

    return await query<PayoutRun>(
        `
        SELECT
            id,
            company_id,
            run_no,
            period_start,
            period_end,
            status,
            total_amount,
            created_at

        FROM payout_runs

        WHERE company_id = $1

        ORDER BY
            created_at DESC
        `,
        [
            companyId,
        ],
    );
}


/*
 * GET ONE PAYOUT RUN
 */
export async function getPayoutRunById(
    payoutRunId: string,
    companyId: string,
): Promise<PayoutRun | null> {

    const result =
        await query<PayoutRun>(
            `
            SELECT
                id,
                company_id,
                run_no,
                period_start,
                period_end,
                status,
                total_amount,
                created_at

            FROM payout_runs

            WHERE id = $1
              AND company_id = $2

            LIMIT 1
            `,
            [
                payoutRunId,
                companyId,
            ],
        );


    return result[0] ?? null;
}


/*
 * GET PAYOUT LINE ITEMS
 *
 * Used by the payout details/view page.
 */
export async function getPayoutLineItems(
    payoutRunId: string,
    companyId: string,
): Promise<PayoutLineItem[]> {

    return await query<PayoutLineItem>(
        `
        SELECT
            pli.id,
            pli.payout_run_id,
            pli.agent_code,
            pli.booking_count,
            pli.gross_volume,
            pli.commission_rate,
            pli.commission_amount

        FROM payout_line_items pli

        INNER JOIN payout_runs pr
            ON pr.id = pli.payout_run_id

        WHERE pli.payout_run_id = $1
          AND pr.company_id = $2

        ORDER BY
            pli.agent_code
        `,
        [
            payoutRunId,
            companyId,
        ],
    );
}