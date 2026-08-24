import { z } from "zod";


const isoDate = z
    .string()
    .regex(
        /^\d{4}-\d{2}-\d{2}$/,
        "Date must be in YYYY-MM-DD format",
    )
    .refine(
        (value) => {
            const date = new Date(
                `${value}T00:00:00.000Z`,
            );

            return (
                !Number.isNaN(
                    date.getTime(),
                ) &&
                date.toISOString()
                    .slice(0, 10) === value
            );
        },
        "Invalid calendar date",
    );


export const createPayoutRunSchema =
    z
        .object({
            periodStart: isoDate,

            periodEnd: isoDate,
        })
        .refine(
            (data) =>
                data.periodStart <=
                data.periodEnd,
            {
                message:
                    "Period end must be on or after period start.",
                path: [
                    "periodEnd",
                ],
            },
        );


export type CreatePayoutRunInput =
    z.infer<
        typeof createPayoutRunSchema
    >;