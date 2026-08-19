import type {
    Request,
    Response,
} from "express";

import {
    getCompanyBookings,
    getCompanyBookingById,
    getMyAgentBookings,
    getMyAgentBookingById,
    updateBooking,
    rejectBooking,
} from "../services/booking-management.service";


/*
 * GET /api/bookings
 *
 * COMPANY_ADMIN / FINANCE:
 *     Can view all bookings in their company.
 *
 * AGENT:
 *     Can view only their own bookings.
 */
export async function getBookingsController(
    req: Request,
    res: Response,
): Promise<void> {

    if (!req.user) {
        res.status(401).json({
            error: {
                code: "UNAUTHORIZED",
                message:
                    "Authentication required.",
            },
        });

        return;
    }

    try {

        let bookings;

        /*
         * AGENT:
         *
         * Only bookings belonging to
         * the authenticated agent.
         */
        if (req.user.role === "AGENT") {

            bookings =
                await getMyAgentBookings(
                    req.user.userId,
                    req.user.companyId,
                );

        } else {

            /*
             * COMPANY_ADMIN / FINANCE:
             *
             * All bookings belonging to
             * their company.
             */
            bookings =
                await getCompanyBookings(
                    req.user.companyId,
                );
        }

        res.status(200).json({
            data: {
                bookings,
            },
        });

    } catch (error: unknown) {

        console.error(
            "Get bookings error:",
            error,
        );

        res.status(500).json({
            error: {
                code:
                    "BOOKINGS_FETCH_FAILED",
                message:
                    "Failed to load bookings.",
            },
        });
    }
}


/*
 * GET /api/bookings/:id
 *
 * COMPANY_ADMIN / FINANCE:
 *     Can view any booking in their company.
 *
 * AGENT:
 *     Can view only their own booking.
 */
export async function getBookingController(
    req: Request,
    res: Response,
): Promise<void> {

    if (!req.user) {
        res.status(401).json({
            error: {
                code: "UNAUTHORIZED",
                message:
                    "Authentication required.",
            },
        });

        return;
    }

    /*
     * Express can type params as:
     *
     * string | string[] | undefined
     *
     * We need to explicitly validate it.
     */
    const bookingId =
        req.params.id;

    if (typeof bookingId !== "string") {
        res.status(400).json({
            error: {
                code:
                    "INVALID_BOOKING_ID",
                message:
                    "Booking ID is required.",
            },
        });

        return;
    }

    try {

        let booking;

        /*
         * AGENT:
         *
         * The service checks both:
         *
         * 1. user_id
         * 2. company_id
         *
         * Therefore an agent cannot access
         * another agent's booking.
         */
        if (req.user.role === "AGENT") {

            booking =
                await getMyAgentBookingById(
                    req.user.userId,
                    req.user.companyId,
                    bookingId,
                );

        } else {

            /*
             * COMPANY_ADMIN / FINANCE:
             *
             * Can access any booking in
             * their own company.
             */
            booking =
                await getCompanyBookingById(
                    req.user.companyId,
                    bookingId,
                );
        }

        if (!booking) {
            res.status(404).json({
                error: {
                    code:
                        "BOOKING_NOT_FOUND",
                    message:
                        "Booking not found.",
                },
            });

            return;
        }

        res.status(200).json({
            data: {
                booking,
            },
        });

    } catch (error: unknown) {

        console.error(
            "Get booking error:",
            error,
        );

        res.status(500).json({
            error: {
                code:
                    "BOOKING_FETCH_FAILED",
                message:
                    "Failed to load booking.",
            },
        });
    }
}


/*
 * PATCH /api/bookings/:id
 *
 * COMPANY_ADMIN:
 *     Can edit.
 *
 * FINANCE:
 *     Can edit.
 *
 * AGENT:
 *     Cannot edit.
 */
export async function updateBookingController(
    req: Request,
    res: Response,
): Promise<void> {

    if (!req.user) {
        res.status(401).json({
            error: {
                code: "UNAUTHORIZED",
                message:
                    "Authentication required.",
            },
        });

        return;
    }

    /*
     * Backend authorization.
     *
     * Never rely only on the frontend
     * to hide the edit button.
     */
    if (
        req.user.role !== "COMPANY_ADMIN" &&
        req.user.role !== "FINANCE"
    ) {
        res.status(403).json({
            error: {
                code: "FORBIDDEN",
                message:
                    "You do not have permission to edit bookings.",
            },
        });

        return;
    }

    const bookingId =
        req.params.id;

    if (typeof bookingId !== "string") {
        res.status(400).json({
            error: {
                code:
                    "INVALID_BOOKING_ID",
                message:
                    "Booking ID is required.",
            },
        });

        return;
    }

    try {

        const {
            bookingDate,
            amount,
            productCode,
            agentCode,
        } = req.body;

        /*
         * Basic body validation.
         *
         * Only fields that are provided
         * will be updated by the service.
         */
        if (
            bookingDate !== undefined &&
            typeof bookingDate !== "string"
        ) {
            res.status(400).json({
                error: {
                    code:
                        "INVALID_BOOKING_DATE",
                    message:
                        "Booking date must be a string.",
                },
            });

            return;
        }

        if (
            amount !== undefined &&
            typeof amount !== "string"
        ) {
            res.status(400).json({
                error: {
                    code:
                        "INVALID_AMOUNT",
                    message:
                        "Amount must be a string.",
                },
            });

            return;
        }

        if (
            productCode !== undefined &&
            typeof productCode !== "string"
        ) {
            res.status(400).json({
                error: {
                    code:
                        "INVALID_PRODUCT",
                    message:
                        "Product code must be a string.",
                },
            });

            return;
        }

        if (
            agentCode !== undefined &&
            typeof agentCode !== "string"
        ) {
            res.status(400).json({
                error: {
                    code:
                        "INVALID_AGENT_CODE",
                    message:
                        "Agent code must be a string.",
                },
            });

            return;
        }

        const booking =
            await updateBooking(
                req.user.companyId,
                bookingId,
                {
                    bookingDate,
                    amount,
                    productCode,
                    agentCode,
                },
            );

        if (!booking) {
            res.status(404).json({
                error: {
                    code:
                        "BOOKING_NOT_FOUND",
                    message:
                        "Booking not found.",
                },
            });

            return;
        }

        res.status(200).json({
            data: {
                booking,
            },
        });

    } catch (error: unknown) {

        /*
         * Agent validation failed.
         */
        if (
            error instanceof Error &&
            error.message ===
            "AGENT_NOT_FOUND"
        ) {
            res.status(400).json({
                error: {
                    code:
                        "AGENT_NOT_FOUND",
                    message:
                        "Agent does not exist or is not active in this company.",
                },
            });

            return;
        }

        console.error(
            "Update booking error:",
            error,
        );

        res.status(500).json({
            error: {
                code:
                    "BOOKING_UPDATE_FAILED",
                message:
                    "Failed to update booking.",
            },
        });
    }
}


/*
 * POST /api/bookings/:id/reject
 *
 * COMPANY_ADMIN:
 *     Can reject.
 *
 * FINANCE:
 *     Can reject.
 *
 * AGENT:
 *     Cannot reject.
 */
export async function rejectBookingController(
    req: Request,
    res: Response,
): Promise<void> {

    if (!req.user) {
        res.status(401).json({
            error: {
                code: "UNAUTHORIZED",
                message:
                    "Authentication required.",
            },
        });

        return;
    }

    /*
     * Backend authorization.
     */
    if (
        req.user.role !== "COMPANY_ADMIN" &&
        req.user.role !== "FINANCE"
    ) {
        res.status(403).json({
            error: {
                code: "FORBIDDEN",
                message:
                    "You do not have permission to reject bookings.",
            },
        });

        return;
    }

    const bookingId =
        req.params.id;

    if (typeof bookingId !== "string") {
        res.status(400).json({
            error: {
                code:
                    "INVALID_BOOKING_ID",
                message:
                    "Booking ID is required.",
            },
        });

        return;
    }

    try {

        const booking =
            await rejectBooking(
                req.user.companyId,
                bookingId,
            );

        if (!booking) {
            res.status(404).json({
                error: {
                    code:
                        "BOOKING_NOT_FOUND",
                    message:
                        "Booking not found.",
                },
            });

            return;
        }

        res.status(200).json({
            data: {
                booking,
            },
        });

    } catch (error: unknown) {

        console.error(
            "Reject booking error:",
            error,
        );

        res.status(500).json({
            error: {
                code:
                    "BOOKING_REJECT_FAILED",
                message:
                    "Failed to reject booking.",
            },
        });
    }
}