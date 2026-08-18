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
 * 1. Validate period
 * 2. Create payout run
 * 3. Find bookings
 * 4. Find commission rules
 * 5. Calculate commission
 * 6. Create payout line items
 * 7. Calculate total from line items
 * 8. Update payout run
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
     * Create payout run ID.
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
     * Find eligible bookings.
     *
     * IMPORTANT:
     *
     * We only filter by company and date here.
     *
     * We do NOT force status = ACTIVE.
     *
     * This avoids the situation where your
     * actual booking status values are different
     * and therefore every booking gets skipped.
     */
    const bookings =
        await query<{
            id: string;
            agent_code: string;
            product_code: string | null;
            amount: string;
            booking_date: string;
            status: string;
        }>(
            `
            SELECT
                id,
                agent_code,
                product_code,
                amount,
                booking_date,
                status

            FROM bookings

            WHERE company_id = $1

              AND booking_date >= $2::date

              AND booking_date < (
                    $3::date + INTERVAL '1 day'
              )

            ORDER BY
                agent_code,
                booking_date,
                id
            `,
            [
                companyId,
                periodStart,
                periodEnd,
            ],
        );


    /*
     * No bookings.
     */
    if (bookings.length === 0) {

        /*
         * Keep total at zero.
         */
        await query(
            `
            UPDATE payout_runs
            SET total_amount = 0
            WHERE id = $1
              AND company_id = $2
            `,
            [
                payoutRunId,
                companyId,
            ],
        );


        const emptyRun =
            await getPayoutRunById(
                payoutRunId,
                companyId,
            );


        if (!emptyRun) {
            throw new Error(
                "PAYOUT_RUN_NOT_FOUND_AFTER_CREATION",
            );
        }


        return emptyRun;
    }


    /*
     * Process every booking individually.
     *
     * This is safer than grouping first because
     * commission rules may depend on product
     * and booking amount.
     */
    for (const booking of bookings) {

        /*
         * Validate agent.
         */
        if (
            !booking.agent_code
        ) {
            continue;
        }


        /*
         * Convert booking amount.
         */
        const bookingAmount =
            Number(
                booking.amount,
            );


        if (
            !Number.isFinite(
                bookingAmount,
            ) ||
            bookingAmount <= 0
        ) {
            continue;
        }


        /*
         * Find matching commission rule.
         *
         * Product-specific rule has priority.
         *
         * Generic rule is used when
         * product_code IS NULL.
         */
        const rules =
            await query<{
                id: string;
                commission_rate: string;
                product_code: string | null;
                min_amount: string;
                max_amount: string | null;
            }>(
                `
                SELECT
                    id,
                    commission_rate,
                    product_code,
                    min_amount,
                    max_amount

                FROM commission_rules

                WHERE company_id = $1

                  AND effective_from <= $2::date

                  AND (
                        effective_to IS NULL
                        OR effective_to >= $2::date
                  )

                  AND min_amount <= $3::numeric

                  AND (
                        max_amount IS NULL
                        OR max_amount >= $3::numeric
                  )

                  AND (
                        product_code = $4
                        OR product_code IS NULL
                  )

                ORDER BY

                    CASE
                        WHEN product_code = $4
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
                    booking.booking_date,
                    bookingAmount,
                    booking.product_code,
                ],
            );


        const matchingRule =
            rules[0];


        /*
         * No commission rule.
         *
         * Skip this booking.
         */
        if (!matchingRule) {
            continue;
        }


        /*
         * Commission rate.
         */
        const commissionRate =
            Number(
                matchingRule.commission_rate,
            );


        if (
            !Number.isFinite(
                commissionRate,
            ) ||
            commissionRate < 0
        ) {
            continue;
        }


        /*
         * Calculate commission.
         *
         * Example:
         *
         * Booking = 100,000
         * Rate = 5%
         *
         * Commission = 5,000
         */
        const commissionAmount =
            Number(
                (
                    bookingAmount *
                    commissionRate /
                    100
                ).toFixed(2),
            );


        /*
         * Check whether the agent already
         * has a payout line.
         */
        const existingLines =
            await query<{
                id: string;
                booking_count: number;
                gross_volume: string;
                commission_rate: string;
                commission_amount: string;
            }>(
                `
                SELECT
                    id,
                    booking_count,
                    gross_volume,
                    commission_rate,
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


        const existingLine =
            existingLines[0];


        /*
         * Existing agent line.
         */
        if (existingLine) {

            await query(
                `
                UPDATE payout_line_items

                SET
                    booking_count =
                        booking_count + 1,

                    gross_volume =
                        gross_volume + $1,

                    commission_amount =
                        commission_amount + $2

                WHERE id = $3
                `,
                [
                    bookingAmount,
                    commissionAmount,
                    existingLine.id,
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
                    1,
                    bookingAmount,
                    commissionRate,
                    commissionAmount,
                ],
            );
        }
    }


    /*
     * IMPORTANT:
     *
     * Calculate payout total from the
     * actual line items in PostgreSQL.
     */
    const totalResult =
        await query<{
            total: string;
        }>(
            `
            SELECT
                COALESCE(
                    SUM(
                        commission_amount
                    ),
                    0
                ) AS total

            FROM payout_line_items

            WHERE payout_run_id = $1
            `,
            [
                payoutRunId,
            ],
        );


    const totalCommission =
        totalResult[0]?.total ??
        "0.00";


    /*
     * Update payout run total.
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
                totalCommission,
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