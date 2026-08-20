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

interface BookingGroup {
    agent_code: string;
    product_code: string;
    booking_date: string;
    booking_count: number;
    gross_volume: string;
}

interface CommissionRule {
    id: string;
    rule_type: "TIERED" | "PRODUCT_OVERRIDE";
    commission_rate: string;
    product_code: string | null;
    min_amount: string;
    max_amount: string | null;
}

/*
 * ---------------------------------------------------------
 * TIERED COMMISSION
 * ---------------------------------------------------------
 */

function calculateTieredCommission(
    amount: number,
    rules: CommissionRule[],
): number {

    if (amount <= 0 || rules.length === 0) {
        return 0;
    }

    const sortedRules = [...rules].sort(
        (a, b) =>
            Number(a.min_amount) -
            Number(b.min_amount),
    );

    let commission = 0;

    for (const rule of sortedRules) {

        const minAmount =
            Number(rule.min_amount);

        const maxAmount =
            rule.max_amount === null
                ? Infinity
                : Number(rule.max_amount);

        if (amount <= minAmount) {
            continue;
        }

        const upperLimit =
            Math.min(
                amount,
                maxAmount,
            );

        const tierAmount =
            Math.max(
                0,
                upperLimit - minAmount,
            );

        if (tierAmount <= 0) {
            continue;
        }

        const rate =
            Number(rule.commission_rate);

        commission +=
            tierAmount *
            rate /
            100;
    }

    return Number(
        commission.toFixed(2),
    );
}


/*
 * ---------------------------------------------------------
 * PRODUCT OVERRIDE
 * ---------------------------------------------------------
 */

async function getProductOverrideRule(
    companyId: string,
    productCode: string,
    bookingDate: string,
): Promise<CommissionRule | null> {

    const rules =
        await query<CommissionRule>(
            `
            SELECT
                id,
                rule_type,
                commission_rate,
                product_code,
                min_amount,
                max_amount

            FROM commission_rules

            WHERE company_id = $1
              AND rule_type = 'PRODUCT_OVERRIDE'
              AND product_code = $2
              AND effective_from <= $3::date

              AND (
                    effective_to IS NULL
                    OR effective_to >= $3::date
              )

            ORDER BY effective_from DESC

            LIMIT 1
            `,
            [
                companyId,
                productCode,
                bookingDate,
            ],
        );

    return rules[0] ?? null;
}


/*
 * ---------------------------------------------------------
 * TIERED RULES
 * ---------------------------------------------------------
 */

async function getTieredRules(
    companyId: string,
    bookingDate: string,
): Promise<CommissionRule[]> {

    return query<CommissionRule>(
        `
        SELECT
            id,
            rule_type,
            commission_rate,
            product_code,
            min_amount,
            max_amount

        FROM commission_rules

        WHERE company_id = $1
          AND rule_type = 'TIERED'
          AND product_code IS NULL
          AND effective_from <= $2::date

          AND (
                effective_to IS NULL
                OR effective_to >= $2::date
          )

        ORDER BY min_amount ASC
        `,
        [
            companyId,
            bookingDate,
        ],
    );
}


/*
 * ---------------------------------------------------------
 * CREATE PAYOUT RUN
 * ---------------------------------------------------------
 */

export async function createPayoutRun(
    companyId: string,
    periodStart: string,
    periodEnd: string,
): Promise<PayoutRun> {

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
     * Create payout run.
     */

    const payoutRunId =
        `run_${randomUUID()}`;

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
     * Get bookings in payout period.
     */

    const bookings =
        await query<BookingGroup>(
            `
            SELECT
                agent_code,
                product_code,
                booking_date,

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
                product_code,
                booking_date

            ORDER BY
                agent_code,
                booking_date,
                product_code
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
        return payoutRun;
    }


    /*
     * -----------------------------------------------------
     * IMPORTANT
     *
     * Save every booking belonging to this payout.
     *
     * We need the actual booking IDs here for refunds.
     * -----------------------------------------------------
     */

    const payoutBookings =
        await query<{
            id: string;
            agent_code: string;
        }>(
            `
            SELECT
                id,
                agent_code

            FROM bookings

            WHERE company_id = $1
              AND booking_date >= $2::date
              AND booking_date <= $3::date
              AND status = 'ACTIVE'
            `,
            [
                companyId,
                periodStart,
                periodEnd,
            ],
        );


    /*
     * Create payout -> booking mappings.
     */

    for (const booking of payoutBookings) {

        const mappingId =
            `payout_booking_${randomUUID()}`;

        await query(
            `
            INSERT INTO payout_booking_items (
                id,
                payout_run_id,
                booking_id
            )

            VALUES (
                $1,
                $2,
                $3
            )

            ON CONFLICT (
                payout_run_id,
                booking_id
            )
            DO NOTHING
            `,
            [
                mappingId,
                payoutRunId,
                booking.id,
            ],
        );
    }


    /*
     * Group bookings by agent.
     */

    const agentGroups =
        new Map<
            string,
            BookingGroup[]
        >();

    for (const booking of bookings) {

        const existing =
            agentGroups.get(
                booking.agent_code,
            );

        if (existing) {
            existing.push(booking);
        } else {
            agentGroups.set(
                booking.agent_code,
                [booking],
            );
        }
    }


    let totalCommission = 0;


    /*
     * Process each agent.
     */

    for (
        const [
            agentCode,
            agentBookings,
        ]
        of agentGroups
    ) {

        const totalAgentVolume =
            agentBookings.reduce(
                (
                    total,
                    booking,
                ) =>
                    total +
                    Number(
                        booking.gross_volume,
                    ),
                0,
            );

        const totalBookingCount =
            agentBookings.reduce(
                (
                    total,
                    booking,
                ) =>
                    total +
                    Number(
                        booking.booking_count,
                    ),
                0,
            );


        let agentCommission = 0;


        /*
         * Product overrides.
         */

        const processedOverrideBookings =
            new Set<string>();

        for (const booking of agentBookings) {

            const productOverride =
                await getProductOverrideRule(
                    companyId,
                    booking.product_code,
                    booking.booking_date,
                );

            if (!productOverride) {
                continue;
            }

            const bookingVolume =
                Number(
                    booking.gross_volume,
                );

            const rate =
                Number(
                    productOverride.commission_rate,
                );

            const commission =
                Number(
                    (
                        bookingVolume *
                        rate /
                        100
                    ).toFixed(2),
                );

            agentCommission +=
                commission;

            processedOverrideBookings.add(
                `${booking.booking_date}_${booking.product_code}`,
            );
        }


        /*
         * Normal tiered bookings.
         */

        const normalBookings =
            agentBookings.filter(
                booking =>
                    !processedOverrideBookings.has(
                        `${booking.booking_date}_${booking.product_code}`,
                    ),
            );


        const bookingsByDate =
            new Map<
                string,
                BookingGroup[]
            >();

        for (
            const booking
            of normalBookings
        ) {

            const existing =
                bookingsByDate.get(
                    booking.booking_date,
                );

            if (existing) {
                existing.push(booking);
            } else {
                bookingsByDate.set(
                    booking.booking_date,
                    [booking],
                );
            }
        }


        for (
            const [
                bookingDate,
                dateBookings,
            ]
            of bookingsByDate
        ) {

            const dateVolume =
                dateBookings.reduce(
                    (
                        total,
                        booking,
                    ) =>
                        total +
                        Number(
                            booking.gross_volume,
                        ),
                    0,
                );

            const tieredRules =
                await getTieredRules(
                    companyId,
                    bookingDate,
                );

            if (tieredRules.length === 0) {
                continue;
            }

            agentCommission +=
                calculateTieredCommission(
                    dateVolume,
                    tieredRules,
                );
        }


        agentCommission =
            Number(
                agentCommission.toFixed(2),
            );


        if (agentCommission <= 0) {
            continue;
        }


        totalCommission +=
            agentCommission;


        const effectiveRate =
            totalAgentVolume > 0
                ? Number(
                    (
                        agentCommission /
                        totalAgentVolume *
                        100
                    ).toFixed(5),
                )
                : 0;


        /*
         * Check existing line.
         */

        const existingLine =
            await query<{
                id: string;
            }>(
                `
                SELECT
                    id

                FROM payout_line_items

                WHERE payout_run_id = $1
                  AND agent_code = $2

                LIMIT 1
                `,
                [
                    payoutRunId,
                    agentCode,
                ],
            );

        const currentLine =
            existingLine[0];


        if (currentLine) {

            await query(
                `
                UPDATE payout_line_items

                SET
                    booking_count = $1,
                    gross_volume = $2,
                    commission_amount = $3,
                    commission_rate = $4

                WHERE id = $5
                `,
                [
                    totalBookingCount,
                    totalAgentVolume,
                    agentCommission,
                    effectiveRate,
                    currentLine.id,
                ],
            );

        } else {

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
                    agentCode,
                    totalBookingCount,
                    totalAgentVolume,
                    effectiveRate,
                    agentCommission,
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
 * ---------------------------------------------------------
 * GET ALL PAYOUT RUNS
 * ---------------------------------------------------------
 */

export async function getPayoutRuns(
    companyId: string,
): Promise<PayoutRun[]> {

    return query<PayoutRun>(
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

        ORDER BY created_at DESC
        `,
        [
            companyId,
        ],
    );
}


/*
 * ---------------------------------------------------------
 * GET ONE PAYOUT RUN
 * ---------------------------------------------------------
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
 * ---------------------------------------------------------
 * GET PAYOUT LINE ITEMS
 * ---------------------------------------------------------
 */

export async function getPayoutLineItems(
    payoutRunId: string,
    companyId: string,
): Promise<PayoutLineItem[]> {

    return query<PayoutLineItem>(
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

        ORDER BY pli.agent_code
        `,
        [
            payoutRunId,
            companyId,
        ],
    );
}


/*
 * ---------------------------------------------------------
 * GET PAYOUT BOOKINGS
 * ---------------------------------------------------------
 */

export async function getPayoutBookings(
    payoutRunId: string,
    companyId: string,
) {

    return query(
        `
        SELECT
            pbi.id,
            pbi.payout_run_id,
            pbi.booking_id,
            b.agent_code,
            b.booking_date,
            b.amount,
            b.currency,
            b.product_code

        FROM payout_booking_items pbi

        INNER JOIN payout_runs pr
            ON pr.id = pbi.payout_run_id

        INNER JOIN bookings b
            ON b.id = pbi.booking_id

        WHERE pbi.payout_run_id = $1
          AND pr.company_id = $2
          AND b.company_id = $2

        ORDER BY b.booking_date
        `,
        [
            payoutRunId,
            companyId,
        ],
    );
}


/*
 * ---------------------------------------------------------
 * GET PAYOUTS FOR AUTHENTICATED AGENT
 * ---------------------------------------------------------
 */

export async function getAgentPayouts(
    companyId: string,
    userId: string,
) {

    return query<{
        payout_run_id: string;
        run_no: number;
        period_start: string;
        period_end: string;
        status: "DRAFT" | "FINALISED";
        agent_code: string;
        booking_count: number;
        gross_volume: string;
        commission_rate: string;
        commission_amount: string;
    }>(
        `
        SELECT
            pr.id AS payout_run_id,
            pr.run_no,
            pr.period_start,
            pr.period_end,
            pr.status,

            pli.agent_code,
            pli.booking_count,
            pli.gross_volume,
            pli.commission_rate,
            pli.commission_amount

        FROM agents a

        INNER JOIN payout_line_items pli
            ON pli.agent_code = a.agent_code

        INNER JOIN payout_runs pr
            ON pr.id = pli.payout_run_id

        WHERE a.user_id = $1
          AND a.company_id = $2
          AND pr.company_id = $2

        ORDER BY pr.created_at DESC
        `,
        [
            userId,
            companyId,
        ],
    );
}