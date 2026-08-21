import { query } from "../db/client";

export type Booking = {
    id: string;
    company_id: string;
    external_ref: string;
    agent_code: string;
    booking_date: string;

    /*
     * Final amount used for payout calculations.
     * This is stored in LKR.
     */
    amount: string;

    /*
     * Currency of the final amount.
     * Normally LKR.
     */
    currency: string;

    /*
     * Original amount charged to the customer.
     */
    original_amount: string | null;

    /*
     * Original currency charged to the customer.
     */
    original_currency: string | null;

    /*
     * Exchange rate actually applied.
     */
    exchange_rate: string | null;

    product_code: string;
    status: string;
};


export type UpdateBookingInput = {
    bookingDate?: string;
    amount?: string;
    productCode?: string;
    agentCode?: string;
};


/*
 * =========================================================
 * GET ALL COMPANY BOOKINGS
 * =========================================================
 */
export async function getCompanyBookings(
    companyId: string,
): Promise<Booking[]> {

    const bookings =
        await query<Booking>(
            `
            SELECT
                id,
                company_id,
                external_ref,
                agent_code,
                booking_date,
                amount,
                currency,
                original_amount,
                original_currency,
                exchange_rate,
                product_code,
                status
            FROM bookings
            WHERE company_id = $1
            ORDER BY booking_date DESC, created_at DESC
            `,
            [
                companyId,
            ],
        );

    return bookings;
}


/*
 * =========================================================
 * GET ONE COMPANY BOOKING
 * =========================================================
 */
export async function getCompanyBookingById(
    companyId: string,
    bookingId: string,
): Promise<Booking | null> {

    const bookings =
        await query<Booking>(
            `
            SELECT
                id,
                company_id,
                external_ref,
                agent_code,
                booking_date,
                amount,
                currency,
                original_amount,
                original_currency,
                exchange_rate,
                product_code,
                status
            FROM bookings
            WHERE id = $1
              AND company_id = $2
            LIMIT 1
            `,
            [
                bookingId,
                companyId,
            ],
        );

    return bookings[0] ?? null;
}


/*
 * =========================================================
 * GET AGENT BOOKINGS
 * =========================================================
 *
 * Agent can only see bookings belonging
 * to their own agent profile.
 */
export async function getMyAgentBookings(
    userId: string,
    companyId: string,
): Promise<Booking[]> {

    const bookings =
        await query<Booking>(
            `
            SELECT
                b.id,
                b.company_id,
                b.external_ref,
                b.agent_code,
                b.booking_date,
                b.amount,
                b.currency,
                b.original_amount,
                b.original_currency,
                b.exchange_rate,
                b.product_code,
                b.status
            FROM bookings b
            INNER JOIN agents a
                ON a.company_id = b.company_id
               AND UPPER(a.agent_code) =
                   UPPER(b.agent_code)
            WHERE a.user_id = $1
              AND b.company_id = $2
            ORDER BY b.booking_date DESC, b.created_at DESC
            `,
            [
                userId,
                companyId,
            ],
        );

    return bookings;
}


/*
 * =========================================================
 * GET ONE AGENT BOOKING
 * =========================================================
 */
export async function getMyAgentBookingById(
    userId: string,
    companyId: string,
    bookingId: string,
): Promise<Booking | null> {

    const bookings =
        await query<Booking>(
            `
            SELECT
                b.id,
                b.company_id,
                b.external_ref,
                b.agent_code,
                b.booking_date,
                b.amount,
                b.currency,
                b.original_amount,
                b.original_currency,
                b.exchange_rate,
                b.product_code,
                b.status
            FROM bookings b
            INNER JOIN agents a
                ON a.company_id = b.company_id
               AND UPPER(a.agent_code) =
                   UPPER(b.agent_code)
            WHERE b.id = $1
              AND a.user_id = $2
              AND b.company_id = $3
            LIMIT 1
            `,
            [
                bookingId,
                userId,
                companyId,
            ],
        );

    return bookings[0] ?? null;
}


/*
 * =========================================================
 * UPDATE BOOKING
 * =========================================================
 *
 * COMPANY_ADMIN / FINANCE only.
 *
 * IMPORTANT:
 *
 * We do NOT change:
 *
 * original_amount
 * original_currency
 * exchange_rate
 *
 * because these represent the original
 * transaction and its audit trail.
 */
export async function updateBooking(
    companyId: string,
    bookingId: string,
    input: UpdateBookingInput,
): Promise<Booking | null> {

    const existing =
        await getCompanyBookingById(
            companyId,
            bookingId,
        );

    if (!existing) {
        return null;
    }


    /*
     * Do not allow editing a rejected booking.
     */
    if (existing.status === "REJECTED") {
        throw new Error(
            "BOOKING_REJECTED",
        );
    }


    const bookingDate =
        input.bookingDate ??
        existing.booking_date;

    const amount =
        input.amount ??
        existing.amount;

    const productCode =
        input.productCode?.toUpperCase() ??
        existing.product_code;

    const agentCode =
        input.agentCode?.toUpperCase() ??
        existing.agent_code;


    /*
     * =====================================================
     * AGENT VALIDATION
     * =====================================================
     */
    if (
        input.agentCode &&
        input.agentCode.toUpperCase() !==
        existing.agent_code.toUpperCase()
    ) {

        const agents =
            await query<{
                id: string;
            }>(
                `
                SELECT id
                FROM agents
                WHERE company_id = $1
                  AND UPPER(agent_code) = UPPER($2)
                  AND status = 'ACTIVE'
                LIMIT 1
                `,
                [
                    companyId,
                    agentCode,
                ],
            );

        if (agents.length === 0) {
            throw new Error(
                "AGENT_NOT_FOUND",
            );
        }
    }


    /*
     * =====================================================
     * UPDATE
     * =====================================================
     *
     * Notice that original_amount,
     * original_currency and exchange_rate
     * are NOT changed.
     */
    const updated =
        await query<Booking>(
            `
            UPDATE bookings
            SET
                booking_date = $1,
                amount = $2,
                product_code = $3,
                agent_code = $4
            WHERE id = $5
              AND company_id = $6
            RETURNING
                id,
                company_id,
                external_ref,
                agent_code,
                booking_date,
                amount,
                currency,
                original_amount,
                original_currency,
                exchange_rate,
                product_code,
                status
            `,
            [
                bookingDate,
                amount,
                productCode,
                agentCode,
                bookingId,
                companyId,
            ],
        );

    return updated[0] ?? null;
}


/*
 * =========================================================
 * REJECT BOOKING
 * =========================================================
 */
export async function rejectBooking(
    companyId: string,
    bookingId: string,
): Promise<Booking | null> {

    const existing =
        await getCompanyBookingById(
            companyId,
            bookingId,
        );

    if (!existing) {
        return null;
    }


    /*
     * Already rejected.
     */
    if (existing.status === "REJECTED") {
        return existing;
    }


    const updated =
        await query<Booking>(
            `
            UPDATE bookings
            SET status = 'REJECTED'
            WHERE id = $1
              AND company_id = $2
            RETURNING
                id,
                company_id,
                external_ref,
                agent_code,
                booking_date,
                amount,
                currency,
                original_amount,
                original_currency,
                exchange_rate,
                product_code,
                status
            `,
            [
                bookingId,
                companyId,
            ],
        );

    return updated[0] ?? null;
}