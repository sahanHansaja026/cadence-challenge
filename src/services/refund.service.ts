import { randomUUID } from "crypto";

import {
    query,
} from "../db/client";

import type {
    CreateRefundInput,
    UpdateRefundStatusInput,
} from "../schemas/refund.schema";


/*
 * ---------------------------------------------------------
 * REFUND TYPE
 * ---------------------------------------------------------
 */
export interface Refund {

    id: string;

    company_id: string;

    booking_id: string;

    /*
     * The payout run that contained
     * the booking.
     *
     * NULL means the booking has not
     * been included in a payout run.
     */
    payout_run_id: string | null;

    amount: string;

    reason: string;

    status:
    | "PENDING"
    | "PROCESSED"
    | "CANCELLED";

    created_by: string;

    created_at: string;

    /*
     * TRUE when the booking was already
     * included in a FINALIZED payout.
     *
     * The finalized payout must NOT be
     * modified.
     *
     * Instead the refund becomes an
     * adjustment for a future payout.
     */
    adjustment_required: boolean;
}


/*
 * ---------------------------------------------------------
 * GET ALL REFUNDS
 * ---------------------------------------------------------
 *
 * Only refunds belonging to the
 * authenticated user's company.
 */
export async function getRefunds(
    companyId: string,
): Promise<Refund[]> {

    return query<Refund>(
        `
        SELECT
            id,
            company_id,
            booking_id,
            payout_run_id,
            amount,
            reason,
            status,
            created_by,
            created_at,
            adjustment_required
        FROM refunds
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
 * GET REFUND BY ID
 * ---------------------------------------------------------
 *
 * company_id is always included.
 *
 * This prevents cross-company access.
 */
export async function getRefundById(
    companyId: string,
    refundId: string,
): Promise<Refund | null> {

    const refunds =
        await query<Refund>(
            `
            SELECT
                id,
                company_id,
                booking_id,
                payout_run_id,
                amount,
                reason,
                status,
                created_by,
                created_at,
                adjustment_required
            FROM refunds
            WHERE id = $1
              AND company_id = $2
            LIMIT 1
            `,
            [
                refundId,
                companyId,
            ],
        );

    return refunds[0] ?? null;
}


/*
 * ---------------------------------------------------------
 * CREATE REFUND
 * ---------------------------------------------------------
 *
 * Business flow:
 *
 * 1. Find booking.
 * 2. Verify booking belongs to company.
 * 3. Validate refund amount.
 * 4. Check previous refunds.
 * 5. Find exact payout relationship using
 *    payout_booking_items.
 * 6. Determine whether payout is FINALIZED.
 * 7. Never modify FINALIZED payout.
 * 8. Create refund.
 * 9. Mark adjustment_required when necessary.
 */
export async function createRefund(
    companyId: string,
    userId: string,
    input: CreateRefundInput,
): Promise<Refund> {


    /*
     * -----------------------------------------------------
     * 1. FIND BOOKING
     * -----------------------------------------------------
     */
    const bookings =
        await query<{
            id: string;
            company_id: string;
            amount: string;
            status: string;
        }>(
            `
            SELECT
                id,
                company_id,
                amount,
                status
            FROM bookings
            WHERE id = $1
              AND company_id = $2
            LIMIT 1
            `,
            [
                input.bookingId,
                companyId,
            ],
        );


    const booking =
        bookings[0];


    if (!booking) {

        throw new Error(
            "BOOKING_NOT_FOUND",
        );
    }


    /*
     * -----------------------------------------------------
     * 2. REFUND AMOUNT
     * -----------------------------------------------------
     */
    const refundAmount =
        Number(input.amount);


    const bookingAmount =
        Number(booking.amount);


    if (
        !Number.isFinite(
            refundAmount,
        ) ||
        refundAmount <= 0
    ) {

        throw new Error(
            "INVALID_REFUND_AMOUNT",
        );
    }


    if (
        !Number.isFinite(
            bookingAmount,
        ) ||
        bookingAmount <= 0
    ) {

        throw new Error(
            "INVALID_BOOKING_AMOUNT",
        );
    }


    /*
     * -----------------------------------------------------
     * 3. CHECK PREVIOUS REFUNDS
     * -----------------------------------------------------
     *
     * CANCELLED refunds don't count.
     */
    const previous =
        await query<{
            total: string;
        }>(
            `
            SELECT
                COALESCE(
                    SUM(amount),
                    0
                ) AS total
            FROM refunds
            WHERE booking_id = $1
              AND company_id = $2
              AND status <> 'CANCELLED'
            `,
            [
                input.bookingId,
                companyId,
            ],
        );


    const alreadyRefunded =
        Number(
            previous[0]?.total ?? "0",
        );


    /*
     * -----------------------------------------------------
     * 4. PREVENT OVER-REFUND
     * -----------------------------------------------------
     */
    if (
        alreadyRefunded +
        refundAmount >
        bookingAmount
    ) {

        throw new Error(
            "REFUND_AMOUNT_EXCEEDS_BOOKING",
        );
    }


    /*
     * -----------------------------------------------------
     * 5. FIND EXACT PAYOUT RELATIONSHIP
     * -----------------------------------------------------
     *
     * IMPORTANT:
     *
     * Do NOT join through agent_code.
     *
     * payout_line_items is aggregated by agent.
     *
     * payout_booking_items identifies the exact
     * booking included in the payout.
     */
    const payoutRuns =
        await query<{
            id: string;

            status:
            | "DRAFT"
            | "FINALISED";

        }>(
            `
            SELECT
                pr.id,
                pr.status
            FROM payout_runs pr

            INNER JOIN payout_booking_items pbi
                ON pbi.payout_run_id = pr.id

            INNER JOIN bookings b
                ON b.id = pbi.booking_id

            WHERE pbi.booking_id = $1
              AND b.company_id = $2
              AND pr.company_id = $2

            ORDER BY
                pr.created_at DESC

            LIMIT 1
            `,
            [
                input.bookingId,
                companyId,
            ],
        );


    const payoutRun =
        payoutRuns[0];


    /*
     * -----------------------------------------------------
     * 6. DETERMINE PAYOUT
     * -----------------------------------------------------
     */
    const payoutRunId =
        payoutRun?.id ?? null;


    /*
     * If the booking was already included
     * in a FINALIZED payout, the existing
     * payout MUST NOT be changed.
     *
     * The refund will instead be applied
     * as an adjustment in a future payout.
     */
    const adjustmentRequired =
        payoutRun?.status === "FINALISED";


    /*
     * -----------------------------------------------------
     * 7. CREATE REFUND
     * -----------------------------------------------------
     */
    const refundId =
        `refund_${randomUUID()}`;


    const refunds =
        await query<Refund>(
            `
            INSERT INTO refunds (
                id,
                company_id,
                booking_id,
                payout_run_id,
                amount,
                reason,
                status,
                created_by,
                adjustment_required
            )
            VALUES (
                $1,
                $2,
                $3,
                $4,
                $5,
                $6,
                'PENDING',
                $7,
                $8
            )
            RETURNING
                id,
                company_id,
                booking_id,
                payout_run_id,
                amount,
                reason,
                status,
                created_by,
                created_at,
                adjustment_required
            `,
            [
                refundId,
                companyId,
                input.bookingId,
                payoutRunId,
                input.amount,
                input.reason,
                userId,
                adjustmentRequired,
            ],
        );


    const refund =
        refunds[0];


    if (!refund) {

        throw new Error(
            "REFUND_CREATION_FAILED",
        );
    }


    return refund;
}


/*
 * ---------------------------------------------------------
 * UPDATE REFUND STATUS
 * ---------------------------------------------------------
 *
 * COMPANY_ADMIN / FINANCE only.
 *
 * PENDING
 *    ↓
 * PROCESSED
 *
 * OR
 *
 * PENDING
 *    ↓
 * CANCELLED
 */
export async function updateRefundStatus(
    companyId: string,
    refundId: string,
    input: UpdateRefundStatusInput,
): Promise<Refund | null> {


    /*
     * -----------------------------------------------------
     * 1. FIND REFUND
     * -----------------------------------------------------
     */
    const existing =
        await getRefundById(
            companyId,
            refundId,
        );


    if (!existing) {

        return null;
    }


    /*
     * -----------------------------------------------------
     * 2. PREVENT INVALID TRANSITIONS
     * -----------------------------------------------------
     */
    if (
        existing.status ===
        "CANCELLED"
    ) {

        throw new Error(
            "REFUND_ALREADY_CANCELLED",
        );
    }


    if (
        existing.status ===
        "PROCESSED"
    ) {

        throw new Error(
            "REFUND_ALREADY_PROCESSED",
        );
    }


    /*
     * -----------------------------------------------------
     * 3. UPDATE STATUS
     * -----------------------------------------------------
     */
    const refunds =
        await query<Refund>(
            `
            UPDATE refunds
            SET status = $1
            WHERE id = $2
              AND company_id = $3
            RETURNING
                id,
                company_id,
                booking_id,
                payout_run_id,
                amount,
                reason,
                status,
                created_by,
                created_at,
                adjustment_required
            `,
            [
                input.status,
                refundId,
                companyId,
            ],
        );


    return refunds[0] ?? null;
}