import { z } from "zod";


/*
 * ---------------------------------------------------------
 * CSV BOOKING ROW
 * ---------------------------------------------------------
 *
 * This represents one normalized row coming from
 * the CSV controller.
 */
export const csvBookingRowSchema = z.object({

    external_ref:
        z.string()
            .trim()
            .min(
                1,
                "External reference is required.",
            ),

    agent_code:
        z.string()
            .trim()
            .min(
                1,
                "Agent code is required.",
            ),

    date:
        z.string()
            .trim()
            .min(
                1,
                "Booking date is required.",
            ),

    amount:
        z.string()
            .trim()
            .min(
                1,
                "Amount is required.",
            ),

    product_code:
        z.string()
            .trim()
            .min(
                1,
                "Product code is required.",
            ),
});


export type CsvBookingRow =
    z.infer<
        typeof csvBookingRowSchema
    >;


/*
 * ---------------------------------------------------------
 * CREATE BOOKING
 * ---------------------------------------------------------
 *
 * Used when creating a booking directly through
 * the API rather than CSV import.
 */
export const createBookingSchema =
    z.object({

        externalRef:
            z.string()
                .trim()
                .min(
                    1,
                    "External reference is required.",
                ),

        agentCode:
            z.string()
                .trim()
                .min(
                    1,
                    "Agent code is required.",
                ),

        bookingDate:
            z.string()
                .trim()
                .min(
                    1,
                    "Booking date is required.",
                ),

        amount:
            z.string()
                .trim()
                .regex(
                    /^\d+(?:\.\d{1,2})?$/,
                    "Amount must be a valid positive amount with maximum 2 decimal places.",
                ),

        currency:
            z.enum([
                "LKR",
                "USD",
            ]),

        productCode:
            z.string()
                .trim()
                .min(
                    1,
                    "Product code is required.",
                ),
    });


export type CreateBookingInput =
    z.infer<
        typeof createBookingSchema
    >;


/*
 * ---------------------------------------------------------
 * UPDATE BOOKING
 * ---------------------------------------------------------
 */
export const updateBookingSchema =
    z.object({

        agentCode:
            z.string()
                .trim()
                .min(
                    1,
                    "Agent code is required.",
                )
                .optional(),

        bookingDate:
            z.string()
                .trim()
                .min(
                    1,
                    "Booking date is required.",
                )
                .optional(),

        amount:
            z.string()
                .trim()
                .regex(
                    /^\d+(?:\.\d{1,2})?$/,
                    "Amount must be a valid positive amount with maximum 2 decimal places.",
                )
                .optional(),

        productCode:
            z.string()
                .trim()
                .min(
                    1,
                    "Product code is required.",
                )
                .optional(),
    });


export type UpdateBookingInput =
    z.infer<
        typeof updateBookingSchema
    >;


/*
 * ---------------------------------------------------------
 * BOOKING STATUS
 * ---------------------------------------------------------
 */
export const bookingStatusSchema =
    z.object({

        status:
            z.enum([
                "ACTIVE",
                "REJECTED",
            ]),
    });


export type BookingStatusInput =
    z.infer<
        typeof bookingStatusSchema
    >;