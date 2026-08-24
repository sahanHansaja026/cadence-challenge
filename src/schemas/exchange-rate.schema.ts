import { z } from "zod";

export const createExchangeRateSchema = z.object({
    effectiveFrom: z.string().date(),
    currency: z.string().length(3).toUpperCase(),
    rateToLkr: z.string().regex(/^\d+(\.\d{1,2})?$/),
    source: z.string().min(1),
});

export const updateExchangeRateSchema = z.object({
    effectiveFrom: z.string().date().optional(),
    currency: z.string().length(3).toUpperCase().optional(),
    rateToLkr: z.string().regex(/^\d+(\.\d{1,2})?$/).optional(),
    source: z.string().min(1).optional(),
});