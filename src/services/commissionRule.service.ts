import { randomUUID } from "crypto";

import { query } from "../db/client";

export type CommissionRuleType =
    | "TIERED"
    | "PRODUCT_OVERRIDE";

export interface CommissionRule {
    id: string;
    company_id: string;
    name: string;
    rule_type: CommissionRuleType;
    product_code: string | null;
    min_amount: string;
    max_amount: string | null;
    commission_rate: string;
    effective_from: string;
    effective_to: string | null;
    created_at: string;
}

export interface CreateCommissionRuleInput {
    name: string;
    ruleType: CommissionRuleType;
    productCode?: string | null;
    minAmount: string;
    maxAmount?: string | null;
    commissionRate: string;
    effectiveFrom: string;
    effectiveTo?: string | null;
}

export interface UpdateCommissionRuleInput {
    name?: string;
    ruleType?: CommissionRuleType;
    productCode?: string | null;
    minAmount?: string;
    maxAmount?: string | null;
    commissionRate?: string;
    effectiveFrom?: string;
    effectiveTo?: string | null;
}

/*
 * Get all commission rules belonging
 * to the authenticated company.
 */
export async function getCommissionRules(
    companyId: string,
): Promise<CommissionRule[]> {
    return await query<CommissionRule>(
        `
        SELECT
            id,
            company_id,
            name,
            rule_type,
            product_code,
            min_amount,
            max_amount,
            commission_rate,
            effective_from,
            effective_to,
            created_at
        FROM commission_rules
        WHERE company_id = $1
        ORDER BY
            effective_from DESC,
            min_amount ASC,
            created_at DESC
        `,
        [
            companyId,
        ],
    );
}


/*
 * Get one commission rule.
 *
 * Company ID is always included so a user
 * cannot access another company's rule.
 */
export async function getCommissionRuleById(
    companyId: string,
    ruleId: string,
): Promise<CommissionRule | null> {
    const rules =
        await query<CommissionRule>(
            `
            SELECT
                id,
                company_id,
                name,
                rule_type,
                product_code,
                min_amount,
                max_amount,
                commission_rate,
                effective_from,
                effective_to,
                created_at
            FROM commission_rules
            WHERE id = $1
              AND company_id = $2
            LIMIT 1
            `,
            [
                ruleId,
                companyId,
            ],
        );

    return rules[0] ?? null;
}


/*
 * Check whether another rule overlaps
 * the supplied date AND amount range.
 *
 * This allows multiple tiers to use the
 * same effective dates as long as their
 * amount ranges do not overlap.
 */
async function hasOverlappingRule(
    companyId: string,
    ruleId: string | null,
    ruleType: CommissionRuleType,
    productCode: string | null,
    effectiveFrom: string,
    effectiveTo: string | null,
    minAmount: string,
    maxAmount: string | null,
): Promise<boolean> {

    /*
     * PRODUCT_OVERRIDE rules are scoped to
     * their product code.
     *
     * TIERED rules are company-wide and have
     * product_code = NULL.
     */
    const rules =
        await query<{ id: string }>(
            `
            SELECT id
            FROM commission_rules
            WHERE company_id = $1

              /*
               * Do not compare a rule with itself
               * during UPDATE.
               */
              AND (
                    $2::text IS NULL
                    OR id <> $2
                  )

              /*
               * Same rule type.
               */
              AND rule_type = $3

              /*
               * Same product scope.
               */
              AND (
                    product_code = $4
                    OR (
                        product_code IS NULL
                        AND $4 IS NULL
                    )
                  )

              /*
               * Effective date ranges overlap.
               *
               * Example:
               *
               * Existing: 2026-08-01 -> 2026-08-31
               * New:      2026-08-15 -> 2026-09-15
               *
               * These overlap.
               */
              AND effective_from <=
                    COALESCE(
                        $6::date,
                        '9999-12-31'::date
                    )

              AND COALESCE(
                    effective_to,
                    '9999-12-31'::date
                  ) >= $5::date

              /*
               * Amount ranges overlap.
               *
               * Existing:
               * 0 -> 100
               *
               * New:
               * 100.01 -> 500
               *
               * These do NOT overlap.
               *
               * Existing:
               * 0 -> 100
               *
               * New:
               * 50 -> 200
               *
               * These DO overlap.
               */
              AND min_amount <=
                    COALESCE(
                        $8::numeric,
                        999999999999.99::numeric
                    )

              AND COALESCE(
                    max_amount,
                    999999999999.99::numeric
                  ) >= $7::numeric

            LIMIT 1
            `,
            [
                companyId,
                ruleId,
                ruleType,
                productCode,
                effectiveFrom,
                effectiveTo,
                minAmount,
                maxAmount,
            ],
        );

    return rules.length > 0;
}


/*
 * Create commission rule.
 */
export async function createCommissionRule(
    companyId: string,
    input: CreateCommissionRuleInput,
): Promise<CommissionRule> {

    /*
     * Product override must have a product.
     */
    if (
        input.ruleType === "PRODUCT_OVERRIDE" &&
        !input.productCode
    ) {
        throw new Error(
            "PRODUCT_CODE_REQUIRED",
        );
    }

    /*
     * Tiered rules must not have a product.
     */
    if (
        input.ruleType === "TIERED" &&
        input.productCode
    ) {
        throw new Error(
            "PRODUCT_CODE_NOT_ALLOWED_FOR_TIERED_RULE",
        );
    }

    /*
     * Validate minimum amount.
     */
    const minAmount =
        Number(input.minAmount);

    if (
        Number.isNaN(minAmount) ||
        minAmount < 0
    ) {
        throw new Error(
            "INVALID_MIN_AMOUNT",
        );
    }

    /*
     * Validate maximum amount.
     */
    if (
        input.maxAmount !== null &&
        input.maxAmount !== undefined
    ) {
        const maxAmount =
            Number(input.maxAmount);

        if (
            Number.isNaN(maxAmount) ||
            maxAmount < minAmount
        ) {
            throw new Error(
                "INVALID_AMOUNT_RANGE",
            );
        }
    }

    /*
     * Validate commission rate.
     */
    const rate =
        Number(input.commissionRate);

    if (
        Number.isNaN(rate) ||
        rate < 0 ||
        rate > 100
    ) {
        throw new Error(
            "INVALID_COMMISSION_RATE",
        );
    }

    /*
     * Validate effective dates.
     */
    if (
        input.effectiveTo &&
        input.effectiveTo <
        input.effectiveFrom
    ) {
        throw new Error(
            "INVALID_EFFECTIVE_DATE_RANGE",
        );
    }

    /*
     * Check date + amount overlap.
     *
     * IMPORTANT:
     *
     * Same effective dates are allowed when
     * the amount ranges are different.
     */
    const overlapping =
        await hasOverlappingRule(
            companyId,
            null,
            input.ruleType,
            input.productCode ?? null,
            input.effectiveFrom,
            input.effectiveTo ?? null,
            input.minAmount,
            input.maxAmount ?? null,
        );

    if (overlapping) {
        throw new Error(
            "COMMISSION_RULE_OVERLAP",
        );
    }

    const id =
        `commission_rule_${randomUUID()}`;

    const rules =
        await query<CommissionRule>(
            `
            INSERT INTO commission_rules (
                id,
                company_id,
                name,
                rule_type,
                product_code,
                min_amount,
                max_amount,
                commission_rate,
                effective_from,
                effective_to
            )
            VALUES (
                $1,
                $2,
                $3,
                $4,
                $5,
                $6,
                $7,
                $8,
                $9,
                $10
            )
            RETURNING
                id,
                company_id,
                name,
                rule_type,
                product_code,
                min_amount,
                max_amount,
                commission_rate,
                effective_from,
                effective_to,
                created_at
            `,
            [
                id,
                companyId,
                input.name,
                input.ruleType,
                input.productCode ?? null,
                input.minAmount,
                input.maxAmount ?? null,
                input.commissionRate,
                input.effectiveFrom,
                input.effectiveTo ?? null,
            ],
        );

    const rule =
        rules[0];

    if (!rule) {
        throw new Error(
            "COMMISSION_RULE_CREATION_FAILED",
        );
    }

    return rule;
}


/*
 * Update commission rule.
 */
export async function updateCommissionRule(
    companyId: string,
    ruleId: string,
    input: UpdateCommissionRuleInput,
): Promise<CommissionRule | null> {

    /*
     * Make sure the rule belongs to the
     * authenticated company.
     */
    const existing =
        await getCommissionRuleById(
            companyId,
            ruleId,
        );

    if (!existing) {
        return null;
    }

    const name =
        input.name ??
        existing.name;

    const ruleType =
        input.ruleType ??
        existing.rule_type;

    const productCode =
        input.productCode !== undefined
            ? input.productCode
            : existing.product_code;

    const minAmount =
        input.minAmount ??
        existing.min_amount;

    const maxAmount =
        input.maxAmount !== undefined
            ? input.maxAmount
            : existing.max_amount;

    const commissionRate =
        input.commissionRate ??
        existing.commission_rate;

    const effectiveFrom =
        input.effectiveFrom ??
        existing.effective_from;

    const effectiveTo =
        input.effectiveTo !== undefined
            ? input.effectiveTo
            : existing.effective_to;

    /*
     * Product validation.
     */
    if (
        ruleType === "PRODUCT_OVERRIDE" &&
        !productCode
    ) {
        throw new Error(
            "PRODUCT_CODE_REQUIRED",
        );
    }

    /*
     * Tiered rules cannot have a product.
     */
    if (
        ruleType === "TIERED" &&
        productCode
    ) {
        throw new Error(
            "PRODUCT_CODE_NOT_ALLOWED_FOR_TIERED_RULE",
        );
    }

    /*
     * Validate minimum amount.
     */
    const numericMin =
        Number(minAmount);

    if (
        Number.isNaN(numericMin) ||
        numericMin < 0
    ) {
        throw new Error(
            "INVALID_MIN_AMOUNT",
        );
    }

    /*
     * Validate maximum amount.
     */
    if (
        maxAmount !== null &&
        maxAmount !== undefined
    ) {
        const numericMax =
            Number(maxAmount);

        if (
            Number.isNaN(numericMax) ||
            numericMax < numericMin
        ) {
            throw new Error(
                "INVALID_AMOUNT_RANGE",
            );
        }
    }

    /*
     * Validate commission rate.
     */
    const rate =
        Number(commissionRate);

    if (
        Number.isNaN(rate) ||
        rate < 0 ||
        rate > 100
    ) {
        throw new Error(
            "INVALID_COMMISSION_RATE",
        );
    }

    /*
     * Validate effective dates.
     */
    if (
        effectiveTo &&
        effectiveTo < effectiveFrom
    ) {
        throw new Error(
            "INVALID_EFFECTIVE_DATE_RANGE",
        );
    }

    /*
     * Check overlap with OTHER rules.
     *
     * The current rule ID is excluded.
     *
     * Same dates are allowed if the amount
     * ranges do not overlap.
     */
    const overlapping =
        await hasOverlappingRule(
            companyId,
            ruleId,
            ruleType,
            productCode ?? null,
            effectiveFrom,
            effectiveTo ?? null,
            minAmount,
            maxAmount ?? null,
        );

    if (overlapping) {
        throw new Error(
            "COMMISSION_RULE_OVERLAP",
        );
    }

    const rules =
        await query<CommissionRule>(
            `
            UPDATE commission_rules
            SET
                name = $1,
                rule_type = $2,
                product_code = $3,
                min_amount = $4,
                max_amount = $5,
                commission_rate = $6,
                effective_from = $7,
                effective_to = $8
            WHERE id = $9
              AND company_id = $10
            RETURNING
                id,
                company_id,
                name,
                rule_type,
                product_code,
                min_amount,
                max_amount,
                commission_rate,
                effective_from,
                effective_to,
                created_at
            `,
            [
                name,
                ruleType,
                productCode ?? null,
                minAmount,
                maxAmount ?? null,
                commissionRate,
                effectiveFrom,
                effectiveTo ?? null,
                ruleId,
                companyId,
            ],
        );

    return rules[0] ?? null;
}


/*
 * Delete commission rule.
 */
export async function deleteCommissionRule(
    companyId: string,
    ruleId: string,
): Promise<boolean> {

    const result =
        await query<{ id: string }>(
            `
            DELETE FROM commission_rules
            WHERE id = $1
              AND company_id = $2
            RETURNING id
            `,
            [
                ruleId,
                companyId,
            ],
        );

    return result.length > 0;
}