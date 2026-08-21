import { z } from "zod";

export const csvBookingRowSchema = z.object({
    external_ref: z.string().trim().min(1),
    agent_code: z.string().trim().min(1),
    date: z.string().trim().min(1),
    amount: z.string().trim().min(1),
    product_code: z.string().trim().min(1),
});

export type CsvBookingRow =
    z.infer<typeof csvBookingRowSchema>;