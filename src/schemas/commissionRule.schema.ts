import { z } from "zod";

export const createCommissionRuleSchema =
    z.object({
        name: z
            .string()
            .min(1, "Rule name is required."),

        ruleType: z.enum([
            "TIERED",
            "PRODUCT_OVERRIDE",
        ]),

        productCode: z
            .string()
            .min(1)
            .optional(),

        minAmount: z
            .string()
            .min(1, "Minimum amount is required."),

        maxAmount: z
            .string()
            .nullable()
            .optional(),

        commissionRate: z
            .string()
            .min(1, "Commission rate is required."),

        effectiveFrom: z
            .string()
            .min(1, "Effective from date is required."),

        effectiveTo: z
            .string()
            .nullable()
            .optional(),
    });

export const updateCommissionRuleSchema =
    createCommissionRuleSchema.partial();

export type CreateCommissionRuleInput =
    z.infer<
        typeof createCommissionRuleSchema
    >;

export type UpdateCommissionRuleInput =
    z.infer<
        typeof updateCommissionRuleSchema
    >;