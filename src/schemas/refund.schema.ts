import { z } from "zod";


export const createRefundSchema =
    z.object({

        bookingId:
            z.string()
                .min(1, "Booking ID is required."),

        amount:
            z.string()
                .regex(
                    /^\d+(\.\d{1,2})?$/,
                    "Amount must be a valid positive amount with maximum 2 decimal places.",
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