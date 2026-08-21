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

interface BookingRecord {
    id: string;
    agent_code: string;
    product_code: string;
    booking_date: string;
    amount: string;
    currency: string;
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
 * =========================================================
 * HELPERS
 * =========================================================
 */

/**
 * Convert a value to a number safely.
 */
function toNumber(value: string | number | null | undefined): number {
    const number = Number(value);

    if (!Number.isFinite(number)) {
        return 0;
    }

    return number;
}


/**
 * Round monetary values to 2 decimal places.
 */
function roundMoney(value: number): number {
    return Number(value.toFixed(2));
}


/**
 * Check whether an amount belongs to a commission rule range.
 *
 * Example:
 *
 * min = 0
 * max = 1000
 *
 * applies to:
 * 0 <= amount <= 1000
 */
function amountMatchesRule(
    amount: number,
    rule: CommissionRule,
): boolean {

    const minAmount =
        toNumber(rule.min_amount);

    const maxAmount =
        rule.max_amount === null
            ? Infinity
            : toNumber(rule.max_amount);

    return (
        amount >= minAmount &&
        amount <= maxAmount
    );
}


/*
 * =========================================================
 * TIERED COMMISSION
 * =========================================================
 *
 * Example:
 *
 * 0 - 1000       = 5%
 * 1000 - 5000    = 7%
 * 5000+          = 10%
 *
 * Amount = 6000
 *
 * 1000 * 5%
 * 4000 * 7%
 * 1000 * 10%
 *
 * Total = 430
 */
function calculateTieredCommission(
    amount: number,
    rules: CommissionRule[],
): number {

    if (
        amount <= 0 ||
        rules.length === 0
    ) {
        return 0;
    }

    const sortedRules =
        [...rules].sort(
            (a, b) =>
                toNumber(a.min_amount) -
                toNumber(b.min_amount),
        );

    let commission = 0;

    for (const rule of sortedRules) {

        const minAmount =
            toNumber(rule.min_amount);

        const maxAmount =
            rule.max_amount === null
                ? Infinity
                : toNumber(rule.max_amount);

        /*
         * No part of the amount is inside
         * this tier.
         */
        if (amount <= minAmount) {
            continue;
        }

        /*
         * Amount covered by this tier.
         */
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
            toNumber(
                rule.commission_rate,
            );

        commission +=
            tierAmount *
            rate /
            100;
    }

    return roundMoney(commission);
}


/*
 * =========================================================
 * PRODUCT OVERRIDE COMMISSION
 * =========================================================
 *
 * Product override has priority over tiered rules.
 *
 * Example:
 *
 * Product: FLIGHT
 * Override rate: 8%
 *
 * Booking amount = 500
 *
 * Commission = 500 * 8% = 40
 */
function calculateProductOverrideCommission(
    amount: number,
    rule: CommissionRule,
): number {

    if (
        amount <= 0 ||
        !amountMatchesRule(
            amount,
            rule,
        )
    ) {
        return 0;
    }

    const rate =
        toNumber(
            rule.commission_rate,
        );

    return roundMoney(
        amount *
        rate /
        100,
    );
}


/*
 * =========================================================
 * GET PRODUCT OVERRIDE RULE
 * =========================================================
 */
async function getProductOverrideRule(
    companyId: string,
    productCode: string,
    bookingDate: string,
    amount: number,
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

              AND min_amount <= $4::numeric

              AND (
                    max_amount IS NULL
                    OR max_amount >= $4::numeric
              )

            ORDER BY
                effective_from DESC,
                min_amount DESC

            LIMIT 1
            `,
            [
                companyId,
                productCode,
                bookingDate,
                amount,
            ],
        );

    return rules[0] ?? null;
}


/*
 * =========================================================
 * GET TIERED RULES
 * =========================================================
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

        ORDER BY
            min_amount ASC
        `,
        [
            companyId,
            bookingDate,
        ],
    );
}


/*
 * =========================================================
 * GET BOOKINGS
 * =========================================================
 */
async function getBookingsForPayout(
    companyId: string,
    periodStart: string,
    periodEnd: string,
): Promise<BookingRecord[]> {

    return query<BookingRecord>(
        `
        SELECT
            id,
            agent_code,
            product_code,
            booking_date,
            amount,
            currency

        FROM bookings

        WHERE company_id = $1

          AND booking_date >= $2::date

          AND booking_date <= $3::date

          AND status = 'ACTIVE'

        ORDER BY
            agent_code,
            booking_date,
            product_code,
            id
        `,
        [
            companyId,
            periodStart,
            periodEnd,
        ],
    );
}


/*
 * =========================================================
 * GET BOOKING GROUPS
 * =========================================================
 */
async function getBookingGroupsForPayout(
    companyId: string,
    periodStart: string,
    periodEnd: string,
): Promise<BookingGroup[]> {

    return query<BookingGroup>(
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
}


/*
 * =========================================================
 * CREATE PAYOUT -> BOOKING MAPPING
 * =========================================================
 */
async function createPayoutBookingMappings(
    payoutRunId: string,
    bookings: BookingRecord[],
): Promise<void> {

    for (const booking of bookings) {

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
}


/*
 * =========================================================
 * CALCULATE AGENT COMMISSION
 * =========================================================
 *
 * Commission is calculated using the booking date.
 *
 * For each agent:
 *
 * 1. Check product override.
 * 2. If override exists, use it.
 * 3. Otherwise use tiered rules.
 *
 * Tiered rules are calculated per booking date.
 */
async function calculateAgentCommission(
    companyId: string,
    agentBookings: BookingRecord[],
): Promise<number> {

    if (agentBookings.length === 0) {
        return 0;
    }

    let totalCommission = 0;


    /*
     * -----------------------------------------------------
     * Group bookings by date.
     * -----------------------------------------------------
     */
    const bookingsByDate =
        new Map<
            string,
            BookingRecord[]
        >();

    for (const booking of agentBookings) {

        const existing =
            bookingsByDate.get(
                booking.booking_date,
            );

        if (existing) {

            existing.push(
                booking,
            );

        } else {

            bookingsByDate.set(
                booking.booking_date,
                [booking],
            );
        }
    }


    /*
     * -----------------------------------------------------
     * Process each booking date.
     * -----------------------------------------------------
     */
    for (
        const [
            bookingDate,
            dateBookings,
        ]
        of bookingsByDate
    ) {

        /*
         * Amount remaining for normal tiered
         * calculation.
         */
        let normalTieredVolume = 0;


        /*
         * -------------------------------------------------
         * PROCESS EACH BOOKING
         * -------------------------------------------------
         */
        for (
            const booking
            of dateBookings
        ) {

            const amount =
                toNumber(
                    booking.amount,
                );


            /*
             * Product override.
             */
            const overrideRule =
                await getProductOverrideRule(
                    companyId,
                    booking.product_code,
                    bookingDate,
                    amount,
                );


            if (overrideRule) {

                const commission =
                    calculateProductOverrideCommission(
                        amount,
                        overrideRule,
                    );

                totalCommission +=
                    commission;

                continue;
            }


            /*
             * No product override.
             *
             * Add booking to the normal
             * tiered calculation.
             */
            normalTieredVolume +=
                amount;
        }


        /*
         * -------------------------------------------------
         * TIERED COMMISSION
         * -------------------------------------------------
         */
        if (
            normalTieredVolume > 0
        ) {

            const tieredRules =
                await getTieredRules(
                    companyId,
                    bookingDate,
                );

            if (
                tieredRules.length > 0
            ) {

                const commission =
                    calculateTieredCommission(
                        normalTieredVolume,
                        tieredRules,
                    );

                totalCommission +=
                    commission;
            }
        }
    }


    return roundMoney(
        totalCommission,
    );
}


/*
 * =========================================================
 * CREATE PAYOUT RUN
 * =========================================================
 */
export async function createPayoutRun(
    companyId: string,
    periodStart: string,
    periodEnd: string,
): Promise<PayoutRun> {

    /*
     * Validate payout period.
     */
    if (
        periodEnd < periodStart
    ) {

        throw new Error(
            "INVALID_PAYOUT_PERIOD",
        );
    }


    /*
     * -----------------------------------------------------
     * Get next payout run number.
     * -----------------------------------------------------
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
            runNumberResult[0]
                ?.next_run_no ?? 1,
        );


    /*
     * -----------------------------------------------------
     * Create DRAFT payout run.
     *
     * IMPORTANT:
     *
     * New payout runs always start as DRAFT.
     * They are not finalised here.
     * -----------------------------------------------------
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
     * -----------------------------------------------------
     * Get all bookings.
     * -----------------------------------------------------
     */
    const bookings =
        await getBookingsForPayout(
            companyId,
            periodStart,
            periodEnd,
        );


    /*
     * No bookings.
     */
    if (
        bookings.length === 0
    ) {

        return payoutRun;
    }


    /*
     * -----------------------------------------------------
     * Save payout -> booking relationships.
     *
     * This is important for refunds later.
     * -----------------------------------------------------
     */
    await createPayoutBookingMappings(
        payoutRunId,
        bookings,
    );


    /*
     * -----------------------------------------------------
     * Group bookings by agent.
     * -----------------------------------------------------
     */
    const agentBookings =
        new Map<
            string,
            BookingRecord[]
        >();


    for (
        const booking
        of bookings
    ) {

        const existing =
            agentBookings.get(
                booking.agent_code,
            );


        if (existing) {

            existing.push(
                booking,
            );

        } else {

            agentBookings.set(
                booking.agent_code,
                [booking],
            );
        }
    }


    let totalCommission = 0;


    /*
     * -----------------------------------------------------
     * Process every agent.
     * -----------------------------------------------------
     */
    for (
        const [
            agentCode,
            bookingsForAgent,
        ]
        of agentBookings
    ) {

        /*
         * Number of bookings.
         */
        const bookingCount =
            bookingsForAgent.length;


        /*
         * Gross booking volume.
         */
        const grossVolume =
            bookingsForAgent.reduce(
                (
                    total,
                    booking,
                ) =>
                    total +
                    toNumber(
                        booking.amount,
                    ),
                0,
            );


        /*
         * Calculate commission.
         */
        const agentCommission =
            await calculateAgentCommission(
                companyId,
                bookingsForAgent,
            );


        /*
         * If no commission exists,
         * don't create a payout line.
         */
        if (
            agentCommission <= 0
        ) {
            continue;
        }


        totalCommission +=
            agentCommission;


        /*
         * Effective rate is informational.
         *
         * Actual commission has already been
         * calculated from the applicable rules.
         */
        const effectiveRate =
            grossVolume > 0
                ? Number(
                    (
                        agentCommission /
                        grossVolume *
                        100
                    ).toFixed(5),
                )
                : 0;


        /*
         * -------------------------------------------------
         * Check existing payout line.
         * -------------------------------------------------
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


        /*
         * -------------------------------------------------
         * Update existing line.
         * -------------------------------------------------
         */
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
                    bookingCount,
                    grossVolume.toFixed(2),
                    agentCommission.toFixed(2),
                    effectiveRate,
                    currentLine.id,
                ],
            );


        } else {

            /*
             * -------------------------------------------------
             * Create payout line.
             * -------------------------------------------------
             */
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
                    bookingCount,
                    grossVolume.toFixed(2),
                    effectiveRate,
                    agentCommission.toFixed(2),
                ],
            );
        }
    }


    /*
     * -----------------------------------------------------
     * Update payout total.
     * -----------------------------------------------------
     */
    const updatedRuns =
        await query<PayoutRun>(
            `
            UPDATE payout_runs

            SET
                total_amount = $1

            WHERE id = $2
              AND company_id = $3
              AND status = 'DRAFT'

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
 * =========================================================
 * GET ALL PAYOUT RUNS
 * =========================================================
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

        ORDER BY
            created_at DESC
        `,
        [
            companyId,
        ],
    );
}


/*
 * =========================================================
 * GET ONE PAYOUT RUN
 * =========================================================
 */
/*
 * =========================================================
 * GET ONE PAYOUT RUN
 * =========================================================
 */
export async function getPayoutRunById(
    payoutRunId: string,
    companyId: string,
) {

    /*
     * ---------------------------------------------------------
     * GET PAYOUT RUN
     * ---------------------------------------------------------
     */
    const payoutRuns =
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

    const payoutRun =
        payoutRuns[0];

    if (!payoutRun) {
        return null;
    }


    /*
     * ---------------------------------------------------------
     * GET PAYOUT LINE ITEMS
     *
     * IMPORTANT:
     *
     * override_volume,
     * override_commission_amount,
     * override_rate
     *
     * are calculated from the payout bookings.
     *
     * They are NOT columns in payout_line_items.
     * ---------------------------------------------------------
     */
    const lineItems =
        await query<{
            id: string;
            payout_run_id: string;
            agent_code: string;
            booking_count: number;
            gross_volume: string;

            /*
             * Total commission calculated for this agent.
             */
            commission_rate: string;
            commission_amount: string;

            /*
             * Product override information.
             */
            override_volume: string;
            override_rate: string;
            override_commission_amount: string;

            /*
             * Normal commission after removing
             * product override commission.
             */
            normal_commission_amount: string;
            normal_rate: string;

            override_applied: boolean;
        }>(
            `
            SELECT

                pli.id,

                pli.payout_run_id,

                pli.agent_code,

                pli.booking_count,

                pli.gross_volume,

                pli.commission_rate,

                pli.commission_amount,


                /*
                 * =================================================
                 * OVERRIDE VOLUME
                 * =================================================
                 *
                 * Only bookings matching a valid PRODUCT_OVERRIDE
                 * rule are included.
                 */
                COALESCE(
                    SUM(
                        CASE
                            WHEN override_rule.id IS NOT NULL
                            THEN b.amount
                            ELSE 0
                        END
                    ),
                    0
                )::numeric
                    AS override_volume,


                /*
                 * =================================================
                 * OVERRIDE RATE
                 * =================================================
                 *
                 * If multiple products have overrides, the highest
                 * applicable rate is shown as informational value.
                 */
                COALESCE(
                    MAX(
                        CASE
                            WHEN override_rule.id IS NOT NULL
                            THEN override_rule.commission_rate
                            ELSE 0
                        END
                    ),
                    0
                )::numeric
                    AS override_rate,


                /*
                 * =================================================
                 * OVERRIDE COMMISSION
                 * =================================================
                 */
                COALESCE(
                    SUM(
                        CASE
                            WHEN override_rule.id IS NOT NULL
                            THEN
                                ROUND(
                                    (
                                        b.amount *
                                        override_rule.commission_rate /
                                        100
                                    )::numeric,
                                    2
                                )
                            ELSE 0
                        END
                    ),
                    0
                )::numeric
                    AS override_commission_amount,


                /*
                 * =================================================
                 * NORMAL COMMISSION
                 * =================================================
                 *
                 * Total payout commission
                 * minus override commission.
                 */
                (
                    pli.commission_amount::numeric
                    -
                    COALESCE(
                        SUM(
                            CASE
                                WHEN override_rule.id IS NOT NULL
                                THEN
                                    ROUND(
                                        (
                                            b.amount *
                                            override_rule.commission_rate /
                                            100
                                        )::numeric,
                                        2
                                    )
                                ELSE 0
                            END
                        ),
                        0
                    )
                )::numeric
                    AS normal_commission_amount,


                /*
                 * =================================================
                 * NORMAL RATE
                 * =================================================
                 *
                 * Normal commission / non-override volume.
                 */
                CASE
                    WHEN
                        (
                            pli.gross_volume::numeric
                            -
                            COALESCE(
                                SUM(
                                    CASE
                                        WHEN override_rule.id IS NOT NULL
                                        THEN b.amount
                                        ELSE 0
                                    END
                                ),
                                0
                            )
                        ) > 0
                    THEN
                        (
                            (
                                pli.commission_amount::numeric
                                -
                                COALESCE(
                                    SUM(
                                        CASE
                                            WHEN override_rule.id IS NOT NULL
                                            THEN
                                                ROUND(
                                                    (
                                                        b.amount *
                                                        override_rule.commission_rate /
                                                        100
                                                    )::numeric,
                                                    2
                                                )
                                            ELSE 0
                                        END
                                    ),
                                    0
                                )
                            )
                            /
                            (
                                pli.gross_volume::numeric
                                -
                                COALESCE(
                                    SUM(
                                        CASE
                                            WHEN override_rule.id IS NOT NULL
                                            THEN b.amount
                                            ELSE 0
                                        END
                                    ),
                                    0
                                )
                            )
                            * 100
                        )::numeric
                    ELSE 0
                END
                    AS normal_rate,


                /*
                 * =================================================
                 * OVERRIDE APPLIED
                 * =================================================
                 */
                CASE
                    WHEN COUNT(
                        CASE
                            WHEN override_rule.id IS NOT NULL
                            THEN 1
                        END
                    ) > 0
                    THEN true
                    ELSE false
                END
                    AS override_applied


            FROM payout_line_items pli


            /*
             * Payout run security.
             */
            INNER JOIN payout_runs pr
                ON pr.id = pli.payout_run_id


            /*
             * Actual bookings included in this payout.
             */
            LEFT JOIN payout_booking_items pbi
                ON pbi.payout_run_id = pr.id


            LEFT JOIN bookings b
                ON b.id = pbi.booking_id
                AND b.agent_code = pli.agent_code
                AND b.company_id = $2


            /*
             * =================================================
             * FIND ONE APPLICABLE PRODUCT OVERRIDE
             * =================================================
             *
             * LATERAL + LIMIT 1 prevents duplicate calculations
             * if multiple matching rules exist.
             */
            LEFT JOIN LATERAL (
                SELECT
                    cr.id,
                    cr.commission_rate

                FROM commission_rules cr

                WHERE cr.company_id = $2

                  AND cr.rule_type = 'PRODUCT_OVERRIDE'

                  AND cr.product_code = b.product_code

                  AND cr.effective_from <= b.booking_date

                  AND (
                        cr.effective_to IS NULL
                        OR cr.effective_to >= b.booking_date
                  )

                  AND cr.min_amount <= b.amount

                  AND (
                        cr.max_amount IS NULL
                        OR cr.max_amount >= b.amount
                  )

                ORDER BY
                    cr.effective_from DESC,
                    cr.min_amount DESC

                LIMIT 1

            ) override_rule
                ON true


            WHERE pli.payout_run_id = $1

              AND pr.company_id = $2


            GROUP BY

                pli.id,

                pli.payout_run_id,

                pli.agent_code,

                pli.booking_count,

                pli.gross_volume,

                pli.commission_rate,

                pli.commission_amount


            ORDER BY
                pli.agent_code
            `,
            [
                payoutRunId,
                companyId,
            ],
        );


    /*
     * ---------------------------------------------------------
     * GET PAYOUT BOOKINGS
     * ---------------------------------------------------------
     */
    const bookings =
        await query<{
            id: string;
            payout_run_id: string;
            booking_id: string;
            agent_code: string;
            booking_date: string;
            amount: string;
            currency: string;
            product_code: string;
        }>(
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

            ORDER BY
                b.booking_date,
                b.id
            `,
            [
                payoutRunId,
                companyId,
            ],
        );


    /*
     * ---------------------------------------------------------
     * RETURN COMPLETE PAYOUT RUN
     * ---------------------------------------------------------
     */
    return {
        ...payoutRun,

        lineItems,

        bookings,
    };
}

/*
 * =========================================================
 * GET PAYOUT LINE ITEMS
 * =========================================================
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

        ORDER BY
            pli.agent_code
        `,
        [
            payoutRunId,
            companyId,
        ],
    );
}


/*
 * =========================================================
 * GET PAYOUT BOOKINGS
 * =========================================================
 *
 * This is especially important for refunds.
 *
 * It tells us exactly which bookings were included
 * in a payout run.
 * =========================================================
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

        ORDER BY
            b.booking_date,
            b.id
        `,
        [
            payoutRunId,
            companyId,
        ],
    );
}



/*
 * =========================================================
 * GET PAYOUTS FOR AUTHENTICATED AGENT
 * =========================================================
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

        override_volume: string;
        override_rate: string;
        override_commission_amount: string;

        override_applied: boolean;

        created_at: string;
    }>(
        `
        SELECT

            pr.id AS payout_run_id,

            pr.run_no,

            pr.period_start,

            pr.period_end,

            pr.status,

            pr.created_at,

            pli.agent_code,

            pli.booking_count,

            pli.gross_volume,

            pli.commission_rate,

            pli.commission_amount,


            /*
             * =================================================
             * OVERRIDE VOLUME
             * =================================================
             */

            COALESCE(
                SUM(
                    CASE
                        WHEN cr.id IS NOT NULL
                        THEN b.amount
                        ELSE 0
                    END
                ),
                0
            )::numeric AS override_volume,


            /*
             * =================================================
             * OVERRIDE RATE
             * =================================================
             */

            COALESCE(
                MAX(
                    CASE
                        WHEN cr.id IS NOT NULL
                        THEN cr.commission_rate
                    END
                ),
                0
            ) AS override_rate,


            /*
             * =================================================
             * OVERRIDE COMMISSION
             *
             * booking amount × override %
             * =================================================
             */

            COALESCE(
                SUM(
                    CASE
                        WHEN cr.id IS NOT NULL
                        THEN
                            b.amount *
                            cr.commission_rate /
                            100
                        ELSE 0
                    END
                ),
                0
            )::numeric AS override_commission_amount,


            /*
             * =================================================
             * OVERRIDE APPLIED
             * =================================================
             */

            CASE
                WHEN COUNT(
                    CASE
                        WHEN cr.id IS NOT NULL
                        THEN 1
                    END
                ) > 0
                THEN true
                ELSE false
            END AS override_applied


        FROM agents a


        /*
         * Agent payout line
         */

        INNER JOIN payout_line_items pli
            ON pli.agent_code = a.agent_code


        /*
         * Payout run
         */

        INNER JOIN payout_runs pr
            ON pr.id = pli.payout_run_id


        /*
         * Bookings included in this payout
         */

        LEFT JOIN payout_booking_items pbi
            ON pbi.payout_run_id = pr.id


        LEFT JOIN bookings b
            ON b.id = pbi.booking_id

            AND b.agent_code = pli.agent_code

            AND b.company_id = $2


        /*
         * =================================================
         * PRODUCT OVERRIDE RULE
         * =================================================
         */

        LEFT JOIN commission_rules cr
            ON cr.company_id = $2

            AND cr.rule_type = 'PRODUCT_OVERRIDE'


            /*
             * Product must match
             */

            AND cr.product_code = b.product_code


            /*
             * Effective date
             */

            AND cr.effective_from <= b.booking_date

            AND (
                cr.effective_to IS NULL
                OR cr.effective_to >= b.booking_date
            )


            /*
             * Minimum amount
             */

            AND cr.min_amount <= b.amount


            /*
             * Maximum amount
             */

            AND (
                cr.max_amount IS NULL
                OR cr.max_amount >= b.amount
            )


        WHERE a.user_id = $1

          AND a.company_id = $2

          AND pr.company_id = $2


        GROUP BY

            pr.id,

            pr.run_no,

            pr.period_start,

            pr.period_end,

            pr.status,

            pr.created_at,

            pli.agent_code,

            pli.booking_count,

            pli.gross_volume,

            pli.commission_rate,

            pli.commission_amount


        ORDER BY
            pr.created_at DESC
        `,
        [
            userId,
            companyId,
        ],
    );
}