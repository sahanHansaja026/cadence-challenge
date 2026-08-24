import {
    describe,
    expect,
    it,
    vi,
    beforeEach,
} from "vitest";

import {
    createCommissionRule,
} from "../services/commissionRule.service";

import { query } from "../db/client";


vi.mock("../db/client", () => ({
    query: vi.fn(),
}));


const mockedQuery =
    vi.mocked(query);


describe("Commission Rule Service", () => {

    beforeEach(() => {
        vi.clearAllMocks();
    });


    /*
     * ---------------------------------------------------------
     * TIERED RULE
     * ---------------------------------------------------------
     */

    it("creates a valid tiered commission rule", async () => {

        /*
         * First query:
         * Check for overlapping rules.
         *
         * Return empty array because there is
         * no overlap.
         *
         * Second query:
         * INSERT the new rule.
         */
        mockedQuery
            .mockResolvedValueOnce([])
            .mockResolvedValueOnce([
                {
                    id: "commission_rule_001",
                    company_id: "company-001",
                    name: "INSURANCE",
                    rule_type: "TIERED",
                    product_code: null,
                    min_amount: "0",
                    max_amount: "1000",
                    commission_rate: "5",
                    effective_from: "2025-12-31",
                    effective_to: null,
                    created_at:
                        "2025-12-31T00:00:00.000Z",
                },
            ]);


        const result =
            await createCommissionRule(
                "company-001",
                {
                    name: "INSURANCE",
                    ruleType: "TIERED",
                    minAmount: "0",
                    maxAmount: "1000",
                    commissionRate: "5",
                    effectiveFrom: "2025-12-31",
                },
            );


        expect(result.name)
            .toBe("INSURANCE");

        expect(result.rule_type)
            .toBe("TIERED");

        expect(result.min_amount)
            .toBe("0");

        expect(result.max_amount)
            .toBe("1000");

        expect(result.commission_rate)
            .toBe("5");
    });


    /*
     * ---------------------------------------------------------
     * OVERLAPPING RULE
     * ---------------------------------------------------------
     */

    it(
        "rejects a commission rule with overlapping amount range",
        async () => {

            /*
             * Existing rule:
             *
             * 0 ---------------- 1000
             *
             * New rule:
             *
             *       500 ---------------- 2000
             *
             * These ranges overlap.
             */

            mockedQuery
                .mockResolvedValueOnce([
                    {
                        id: "commission_rule_existing",
                    },
                ]);


            await expect(
                createCommissionRule(
                    "company-001",
                    {
                        name:
                            "INSURANCE OVERLAP",

                        ruleType:
                            "TIERED",

                        minAmount:
                            "500",

                        maxAmount:
                            "2000",

                        commissionRate:
                            "7",

                        effectiveFrom:
                            "2025-12-31",
                    },
                ),
            ).rejects.toThrow(
                "COMMISSION_RULE_OVERLAP",
            );


            /*
             * INSERT must never happen
             * when an overlap is detected.
             */
            expect(mockedQuery)
                .toHaveBeenCalledTimes(1);
        },
    );


    /*
     * ---------------------------------------------------------
     * NON-OVERLAPPING TIER
     * ---------------------------------------------------------
     */

    it(
        "allows a commission rule when amount ranges do not overlap",
        async () => {

            /*
             * Existing rule:
             *
             * 0 ---------------- 1000
             *
             * New rule:
             *
             *                       1000.01 -------- 5000
             *
             * These ranges do not overlap.
             */

            mockedQuery
                .mockResolvedValueOnce([])
                .mockResolvedValueOnce([
                    {
                        id: "commission_rule_002",
                        company_id: "company-001",
                        name:
                            "INSURANCE TIER 2",
                        rule_type: "TIERED",
                        product_code: null,
                        min_amount: "1000.01",
                        max_amount: "5000",
                        commission_rate: "7",
                        effective_from:
                            "2025-12-31",
                        effective_to: null,
                        created_at:
                            "2025-12-31T00:00:00.000Z",
                    },
                ]);


            const result =
                await createCommissionRule(
                    "company-001",
                    {
                        name:
                            "INSURANCE TIER 2",

                        ruleType:
                            "TIERED",

                        minAmount:
                            "1000.01",

                        maxAmount:
                            "5000",

                        commissionRate:
                            "7",

                        effectiveFrom:
                            "2025-12-31",
                    },
                );


            expect(result.name)
                .toBe("INSURANCE TIER 2");

            expect(result.min_amount)
                .toBe("1000.01");

            expect(result.max_amount)
                .toBe("5000");

            expect(result.commission_rate)
                .toBe("7");
        },
    );


    /*
     * ---------------------------------------------------------
     * PRODUCT OVERRIDE
     * ---------------------------------------------------------
     */

    it(
        "allows a product override rule",
        async () => {

            mockedQuery
                .mockResolvedValueOnce([])
                .mockResolvedValueOnce([
                    {
                        id: "commission_rule_003",
                        company_id: "company-001",
                        name:
                            "Insurance Override",
                        rule_type:
                            "PRODUCT_OVERRIDE",
                        product_code:
                            "INSURANCE",
                        min_amount: "0",
                        max_amount: "5000",
                        commission_rate: "10",
                        effective_from:
                            "2025-12-31",
                        effective_to: null,
                        created_at:
                            "2025-12-31T00:00:00.000Z",
                    },
                ]);


            const result =
                await createCommissionRule(
                    "company-001",
                    {
                        name:
                            "Insurance Override",

                        ruleType:
                            "PRODUCT_OVERRIDE",

                        productCode:
                            "INSURANCE",

                        minAmount:
                            "0",

                        maxAmount:
                            "5000",

                        commissionRate:
                            "10",

                        effectiveFrom:
                            "2025-12-31",
                    },
                );


            expect(result.rule_type)
                .toBe("PRODUCT_OVERRIDE");

            expect(result.product_code)
                .toBe("INSURANCE");
        },
    );


    /*
     * ---------------------------------------------------------
     * PRODUCT OVERRIDE VALIDATION
     * ---------------------------------------------------------
     */

    it(
        "rejects product override without product code",
        async () => {

            await expect(
                createCommissionRule(
                    "company-001",
                    {
                        name:
                            "Invalid Override",

                        ruleType:
                            "PRODUCT_OVERRIDE",

                        minAmount:
                            "0",

                        maxAmount:
                            "5000",

                        commissionRate:
                            "10",

                        effectiveFrom:
                            "2025-12-31",
                    },
                ),
            ).rejects.toThrow(
                "PRODUCT_CODE_REQUIRED",
            );


            /*
             * Database should not be queried
             * because validation fails first.
             */
            expect(mockedQuery)
                .not.toHaveBeenCalled();
        },
    );


    /*
     * ---------------------------------------------------------
     * TIERED PRODUCT VALIDATION
     * ---------------------------------------------------------
     */

    it(
        "rejects tiered rule with product code",
        async () => {

            await expect(
                createCommissionRule(
                    "company-001",
                    {
                        name:
                            "Invalid Tier",

                        ruleType:
                            "TIERED",

                        productCode:
                            "INSURANCE",

                        minAmount:
                            "0",

                        maxAmount:
                            "5000",

                        commissionRate:
                            "5",

                        effectiveFrom:
                            "2025-12-31",
                    },
                ),
            ).rejects.toThrow(
                "PRODUCT_CODE_NOT_ALLOWED_FOR_TIERED_RULE",
            );


            expect(mockedQuery)
                .not.toHaveBeenCalled();
        },
    );


    /*
     * ---------------------------------------------------------
     * COMMISSION RATE
     * ---------------------------------------------------------
     */

    it(
        "rejects commission rate greater than 100",
        async () => {

            await expect(
                createCommissionRule(
                    "company-001",
                    {
                        name:
                            "Invalid Rate",

                        ruleType:
                            "TIERED",

                        minAmount:
                            "0",

                        maxAmount:
                            "5000",

                        commissionRate:
                            "101",

                        effectiveFrom:
                            "2025-12-31",
                    },
                ),
            ).rejects.toThrow(
                "INVALID_COMMISSION_RATE",
            );
        },
    );


    it(
        "rejects negative commission rate",
        async () => {

            await expect(
                createCommissionRule(
                    "company-001",
                    {
                        name:
                            "Invalid Rate",

                        ruleType:
                            "TIERED",

                        minAmount:
                            "0",

                        maxAmount:
                            "5000",

                        commissionRate:
                            "-1",

                        effectiveFrom:
                            "2025-12-31",
                    },
                ),
            ).rejects.toThrow(
                "INVALID_COMMISSION_RATE",
            );
        },
    );


    /*
     * ---------------------------------------------------------
     * AMOUNT RANGE
     * ---------------------------------------------------------
     */

    it(
        "rejects maximum amount smaller than minimum amount",
        async () => {

            await expect(
                createCommissionRule(
                    "company-001",
                    {
                        name:
                            "Invalid Range",

                        ruleType:
                            "TIERED",

                        minAmount:
                            "5000",

                        maxAmount:
                            "1000",

                        commissionRate:
                            "5",

                        effectiveFrom:
                            "2025-12-31",
                    },
                ),
            ).rejects.toThrow(
                "INVALID_AMOUNT_RANGE",
            );
        },
    );


    /*
     * ---------------------------------------------------------
     * EFFECTIVE DATE RANGE
     * ---------------------------------------------------------
     */

    it(
        "rejects effective end date before start date",
        async () => {

            await expect(
                createCommissionRule(
                    "company-001",
                    {
                        name:
                            "Invalid Dates",

                        ruleType:
                            "TIERED",

                        minAmount:
                            "0",

                        maxAmount:
                            "5000",

                        commissionRate:
                            "5",

                        effectiveFrom:
                            "2026-12-31",

                        effectiveTo:
                            "2026-01-01",
                    },
                ),
            ).rejects.toThrow(
                "INVALID_EFFECTIVE_DATE_RANGE",
            );
        },
    );

});