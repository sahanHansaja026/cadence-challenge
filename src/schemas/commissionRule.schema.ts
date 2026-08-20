import { z } from "zod";


/*
 * Create commission rule
 */
export const createCommissionRuleSchema =
    z.object({
        name: z
            .string()
            .trim()
            .min(
                1,
                "Rule name is required.",
            ),

        ruleType: z.enum([
            "TIERED",
            "PRODUCT_OVERRIDE",
        ]),

        productCode: z
            .string()
            .trim()
            .min(
                1,
                "Product code cannot be empty.",
            )
            .optional(),

        minAmount: z
            .string()
            .trim()
            .min(
                1,
                "Minimum amount is required.",
            ),

        maxAmount: z
            .string()
            .trim()
            .nullable()
            .optional(),

        commissionRate: z
            .string()
            .trim()
            .min(
                1,
                "Commission rate is required.",
            ),

        effectiveFrom: z
            .string()
            .trim()
            .min(
                1,
                "Effective from date is required.",
            ),

        effectiveTo: z
            .string()
            .trim()
            .nullable()
            .optional(),
    });


/*
 * Update commission rule
 */
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