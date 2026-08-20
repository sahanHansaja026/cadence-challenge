import { z } from "zod";


/*
 * ---------------------------------------------------------
 * CREATE REFUND
 * ---------------------------------------------------------
 */
export const createRefundSchema =
    z.object({

        bookingId:
            z.string()
                .trim()
                .min(
                    1,
                    "Booking ID is required.",
                ),

        amount:
            z.string()
                .trim()
                .regex(
                    /^\d+(\.\d{1,2})?$/,
                    "Amount must be a valid positive amount with maximum 2 decimal places.",
                )
                .refine(
                    (value) =>
                        Number(value) > 0,
                    {
                        message:
                            "Refund amount must be greater than zero.",
                    },
                ),

        reason:
            z.string()
                .trim()
                .min(
                    1,
                    "Refund reason is required.",
                )
                .max(
                    500,
                    "Refund reason is too long.",
                ),
    });


/*
 * ---------------------------------------------------------
 * UPDATE REFUND STATUS
 * ---------------------------------------------------------
 */
export const updateRefundStatusSchema =
    z.object({

        status:
            z.enum([
                "PROCESSED",
                "CANCELLED",
            ]),
    });


export type CreateRefundInput =
    z.infer<
        typeof createRefundSchema
    >;


export type UpdateRefundStatusInput =
    z.infer<
        typeof updateRefundStatusSchema
    >;