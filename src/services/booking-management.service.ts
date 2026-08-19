import { query } from "../db/client";

export type Booking = {
    id: string;
    company_id: string;
    external_ref: string;
    agent_code: string;
    booking_date: string;
    amount: string;
    currency: string;
    product_code: string;
    status: string;
};

export type UpdateBookingInput = {
    bookingDate?: string;
    amount?: string;
    productCode?: string;
    agentCode?: string;
};

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
                product_code,
                status
            FROM bookings
            WHERE company_id = $1
            ORDER BY booking_date DESC, created_at DESC
            `,
            [companyId],
        );

    return bookings;
}


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
 * Agent can only see bookings
 * belonging to their own agent profile.
 *
 * agents.user_id must point to users.id.
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
 * Agent can view one of their own bookings.
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
 * Update booking.
 *
 * Only COMPANY_ADMIN and FINANCE
 * should be allowed to call this service.
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
     * If agent code is being changed,
     * make sure that agent exists in
     * the same company and is active.
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
     * Update only the editable fields.
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
 * Reject booking.
 *
 * We do NOT delete the booking.
 * We keep the historical record.
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