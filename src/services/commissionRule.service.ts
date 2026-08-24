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
|--------------------------------------------------------------------------
| GET ALL COMMISSION RULES
|--------------------------------------------------------------------------
*/

export async function getCommissionRules(
    companyId: string,
): Promise<CommissionRule[]> {

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
            WHERE company_id = $1
            ORDER BY
                effective_from DESC,
                min_amount ASC,
                created_at DESC
            `,
            [companyId],
        );

    return rules;
}


/*
|--------------------------------------------------------------------------
| GET ONE COMMISSION RULE
|--------------------------------------------------------------------------
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
|--------------------------------------------------------------------------
| CHECK OVERLAPPING RULE
|--------------------------------------------------------------------------
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

    const rows =
        await query<{ id: string }>(
            `
            SELECT id
            FROM commission_rules

            WHERE company_id = $1

              AND (
                    $2::text IS NULL
                    OR id <> $2
                  )

              AND rule_type = $3

              AND (
                    product_code = $4
                    OR (
                        product_code IS NULL
                        AND $4 IS NULL
                    )
                  )

              AND effective_from <=
                    COALESCE(
                        $6::date,
                        '9999-12-31'::date
                    )

              AND COALESCE(
                    effective_to,
                    '9999-12-31'::date
                  ) >= $5::date

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

    return rows.length > 0;
}


/*
|--------------------------------------------------------------------------
| CREATE COMMISSION RULE
|--------------------------------------------------------------------------
*/

export async function createCommissionRule(
    companyId: string,
    input: CreateCommissionRuleInput,
): Promise<CommissionRule> {

    /*
     * PRODUCT_OVERRIDE requires product code.
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
     * TIERED cannot have product code.
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
        input.maxAmount !== undefined &&
        input.maxAmount !== ""
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

    const commissionRate =
        Number(input.commissionRate);

    if (
        Number.isNaN(commissionRate) ||
        commissionRate < 0 ||
        commissionRate > 100
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
     * Check overlapping rule.
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


    /*
     * Generate ID.
     */

    const id =
        `commission_rule_${randomUUID()}`;


    /*
     * Insert.
     */

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
|--------------------------------------------------------------------------
| UPDATE COMMISSION RULE
|--------------------------------------------------------------------------
*/

export async function updateCommissionRule(
    companyId: string,
    ruleId: string,
    input: UpdateCommissionRuleInput,
): Promise<CommissionRule | null> {

    /*
     * Get existing rule.
     */

    const existing =
        await getCommissionRuleById(
            companyId,
            ruleId,
        );

    if (!existing) {
        return null;
    }


    /*
     * Merge existing values with
     * incoming values.
     */

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
     * PRODUCT_OVERRIDE requires product.
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
     * TIERED cannot have product.
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
     * Validate minimum.
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
     * Validate maximum.
     */

    if (
        maxAmount !== null &&
        maxAmount !== undefined &&
        maxAmount !== ""
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

    const numericRate =
        Number(commissionRate);

    if (
        Number.isNaN(numericRate) ||
        numericRate < 0 ||
        numericRate > 100
    ) {
        throw new Error(
            "INVALID_COMMISSION_RATE",
        );
    }


    /*
     * Validate dates.
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
     * Check overlap.
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


    /*
     * Update.
     */

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
|--------------------------------------------------------------------------
| DELETE COMMISSION RULE
|--------------------------------------------------------------------------
*/

export async function deleteCommissionRule(
    companyId: string,
    ruleId: string,
): Promise<boolean> {

    const rows =
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

    return rows.length > 0;
}