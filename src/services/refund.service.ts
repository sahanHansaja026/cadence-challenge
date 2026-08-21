import { randomUUID } from "crypto";
import Decimal from "decimal.js";

import {
    query,
} from "../db/client";

import type {
    CreateRefundInput,
    UpdateRefundStatusInput,
} from "../schemas/refund.schema";


export interface Refund {

    id: string;

    company_id: string;

    booking_id: string;

    payout_run_id: string | null;

    amount: string;

    reason: string;

    status:
    | "PENDING"
    | "PROCESSED"
    | "CANCELLED";

    created_by: string;

    created_at: string;

    adjustment_required: boolean;
}


export interface RefundAdjustment {

    id: string;

    booking_id: string;

    payout_run_id: string | null;

    amount: string;

    reason: string;
}


/*
 * ---------------------------------------------------------
 * GET ALL REFUNDS
 * ---------------------------------------------------------
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
 */

export async function createRefund(
    companyId: string,
    userId: string,
    input: CreateRefundInput,
): Promise<Refund> {

    /*
     * 1. Find booking.
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
     * 2. Validate refund amount.
     */

    const refundAmount =
        new Decimal(input.amount);

    const bookingAmount =
        new Decimal(booking.amount);

    if (
        !refundAmount.isFinite() ||
        refundAmount.lte(0)
    ) {
        throw new Error(
            "INVALID_REFUND_AMOUNT",
        );
    }

    if (
        !bookingAmount.isFinite() ||
        bookingAmount.lte(0)
    ) {
        throw new Error(
            "INVALID_BOOKING_AMOUNT",
        );
    }


    /*
     * 3. Calculate previous refunds.
     *
     * CANCELLED refunds do not count.
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
        new Decimal(
            previous[0]?.total ?? "0",
        );


    /*
     * 4. Prevent over-refund.
     */

    if (
        alreadyRefunded
            .plus(refundAmount)
            .gt(bookingAmount)
    ) {
        throw new Error(
            "REFUND_AMOUNT_EXCEEDS_BOOKING",
        );
    }


    /*
     * 5. Find payout containing booking.
     *
     * IMPORTANT:
     *
     * We use payout_booking_items.
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
     * 6. Determine payout information.
     */

    const payoutRunId =
        payoutRun?.id ?? null;

    const adjustmentRequired =
        payoutRun?.status === "FINALISED";


    /*
     * 7. Create refund.
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
                refundAmount.toFixed(2),
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
 */

export async function updateRefundStatus(
    companyId: string,
    refundId: string,
    input: UpdateRefundStatusInput,
): Promise<Refund | null> {

    const existing =
        await getRefundById(
            companyId,
            refundId,
        );

    if (!existing) {
        return null;
    }


    /*
     * Processed refunds cannot change.
     */

    if (
        existing.status === "PROCESSED"
    ) {
        throw new Error(
            "REFUND_ALREADY_PROCESSED",
        );
    }


    /*
     * Cancelled refunds cannot change.
     */

    if (
        existing.status === "CANCELLED"
    ) {
        throw new Error(
            "REFUND_ALREADY_CANCELLED",
        );
    }


    /*
     * Update status.
     */

    const refunds =
        await query<Refund>(
            `
            UPDATE refunds

            SET
                status = $1

            WHERE id = $2
              AND company_id = $3
              AND status = 'PENDING'

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


/*
 * ---------------------------------------------------------
 * GET REFUND ADJUSTMENTS
 * ---------------------------------------------------------
 */

export async function getRefundAdjustmentsForPayout(
    companyId: string,
): Promise<RefundAdjustment[]> {

    return query<RefundAdjustment>(
        `
        SELECT
            id,
            booking_id,
            payout_run_id,
            amount,
            reason

        FROM refunds

        WHERE company_id = $1
          AND status = 'PROCESSED'
          AND adjustment_required = TRUE

        ORDER BY created_at ASC
        `,
        [
            companyId,
        ],
    );
}


/*
 * ---------------------------------------------------------
 * GET TOTAL REFUND ADJUSTMENTS
 * ---------------------------------------------------------
 */

export async function getRefundAdjustmentTotal(
    companyId: string,
): Promise<string> {

    const rows =
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

            WHERE company_id = $1
              AND status = 'PROCESSED'
              AND adjustment_required = TRUE
            `,
            [
                companyId,
            ],
        );

    const total =
        new Decimal(
            rows[0]?.total ?? "0",
        );

    return total.toFixed(2);
}


/*
 * ---------------------------------------------------------
 * GET PENDING REFUND ADJUSTMENTS
 * ---------------------------------------------------------
 */

export async function getPendingRefundAdjustments(
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
          AND status = 'PROCESSED'
          AND adjustment_required = TRUE

        ORDER BY created_at ASC
        `,
        [
            companyId,
        ],
    );
}


/*
 * ---------------------------------------------------------
 * MARK REFUND ADJUSTMENT APPLIED
 * ---------------------------------------------------------
 */

export async function markRefundAdjustmentApplied(
    companyId: string,
    refundId: string,
): Promise<Refund | null> {

    const refunds =
        await query<Refund>(
            `
            UPDATE refunds

            SET
                adjustment_required = FALSE

            WHERE id = $1
              AND company_id = $2
              AND status = 'PROCESSED'
              AND adjustment_required = TRUE

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
            ],
        );

    return refunds[0] ?? null;
}