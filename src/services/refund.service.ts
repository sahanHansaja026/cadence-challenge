import { randomUUID } from "crypto";

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
}


/*
 * Get all refunds belonging to
 * the authenticated company.
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
            created_at
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
 * Get one refund.
 *
 * company_id is deliberately included
 * in the WHERE clause.
 *
 * This prevents one company from
 * accessing another company's refund.
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
                created_at
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
 * Create refund.
 */
export async function createRefund(
    companyId: string,
    userId: string,
    input: CreateRefundInput,
): Promise<Refund> {

    /*
     * Find booking.
     */
    const bookings =
        await query<{
            id: string;
            company_id: string;
            amount: string;
        }>(
            `
            SELECT
                id,
                company_id,
                amount
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
     * Convert requested amount.
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


    /*
     * Find already-created refunds.
     *
     * Cancelled refunds do not count.
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
     * Prevent refunding more than
     * the original booking amount.
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
     * Find the latest payout run
     * containing this booking's agent.
     *
     * This is used only to determine
     * whether the booking is already
     * part of a finalised payout.
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
            INNER JOIN payout_line_items pli
                ON pli.payout_run_id = pr.id
            INNER JOIN bookings b
                ON b.agent_code = pli.agent_code
            WHERE b.id = $1
              AND pr.company_id = $2
            ORDER BY pr.created_at DESC
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
     * If the booking was already included
     * in a finalised payout run, we keep
     * the reference to that run.
     *
     * We DO NOT modify the finalised run.
     */
    const payoutRunId =
        payoutRun?.id ?? null;


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
                created_by
            )
            VALUES (
                $1,
                $2,
                $3,
                $4,
                $5,
                $6,
                'PENDING',
                $7
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
                created_at
            `,
            [
                refundId,
                companyId,
                input.bookingId,
                payoutRunId,
                input.amount,
                input.reason,
                userId,
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
 * Update refund status.
 *
 * COMPANY_ADMIN / FINANCE only.
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
     * A cancelled refund cannot be
     * processed later.
     */
    if (
        existing.status ===
        "CANCELLED"
    ) {
        throw new Error(
            "REFUND_ALREADY_CANCELLED",
        );
    }


    /*
     * A processed refund should not
     * be changed again.
     */
    if (
        existing.status ===
        "PROCESSED"
    ) {
        throw new Error(
            "REFUND_ALREADY_PROCESSED",
        );
    }


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
                created_at
            `,
            [
                input.status,
                refundId,
                companyId,
            ],
        );

    return refunds[0] ?? null;
}