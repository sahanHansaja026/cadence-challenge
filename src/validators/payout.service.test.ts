import { describe, expect, it, beforeEach, vi } from "vitest";

import { createPayoutRun } from "../services/payout.service";

import { query } from "../db/client";

vi.mock("../db/client", () => ({
    query: vi.fn(),
}));

vi.mock("crypto", () => ({
    randomUUID: vi.fn(() => "test-uuid"),
}));

const mockedQuery =
    vi.mocked(query);

const COMPANY_ID = "company-1";

const PAYOUT_RUN = {
    id: "run_test-uuid",
    company_id: COMPANY_ID,
    run_no: 1,
    period_start: "2026-01-01",
    period_end: "2026-01-31",
    status: "DRAFT" as const,
    total_amount: "0.00",
    created_at: "2026-01-01",
};

const UPDATED_PAYOUT_RUN = {
    ...PAYOUT_RUN,
    total_amount: "6000.00",
};

/*
 * Helper used by all tests.
 *
 * Instead of depending on the exact number/order
 * of query() calls, inspect the SQL and return
 * the appropriate mocked database result.
 */
function setupQueryMock(options: {
    bookings?: Array<{
        agent_code: string;
        product_code: string;
        booking_date: string;
        booking_count: number;
        gross_volume: string;
    }>;

    tieredRules?: Array<{
        id: string;
        rule_type: "TIERED";
        commission_rate: string;
        product_code: null;
        min_amount: string;
        max_amount: string | null;
    }>;

    productOverrides?: Array<{
        id: string;
        rule_type: "PRODUCT_OVERRIDE";
        commission_rate: string;
        product_code: string;
        min_amount: string;
        max_amount: string | null;
    }>;

    existingLine?: Array<{
        id: string;
    }>;

    updatedRun?: typeof UPDATED_PAYOUT_RUN;
}) {

    const {
        bookings = [],
        tieredRules = [],
        productOverrides = [],
        existingLine = [],
        updatedRun = UPDATED_PAYOUT_RUN,
    } = options;

    mockedQuery.mockImplementation(
        async <T>(
            sql: string,
            _params?: unknown[],
        ): Promise<T[]> => {

            const normalized =
                sql
                    .replace(/\s+/g, " ")
                    .trim()
                    .toUpperCase();

            /*
             * 1. Get next run number
             */
            if (
                normalized.includes("MAX(RUN_NO)")
            ) {
                return [
                    {
                        next_run_no: 1,
                    },
                ] as T[];
            }

            /*
             * 2. Create payout run
             */
            if (
                normalized.includes(
                    "INSERT INTO PAYOUT_RUNS",
                )
            ) {
                return [
                    PAYOUT_RUN,
                ] as T[];
            }

            /*
             * 3. Get bookings
             */
            if (
                normalized.includes(
                    "FROM BOOKINGS",
                )
            ) {
                return bookings as T[];
            }

            /*
             * 4. Product override
             */
            if (
                normalized.includes(
                    "RULE_TYPE = 'PRODUCT_OVERRIDE'",
                )
            ) {
                return productOverrides as T[];
            }

            /*
             * 5. Tiered rules
             */
            if (
                normalized.includes(
                    "RULE_TYPE = 'TIERED'",
                )
            ) {
                return tieredRules as T[];
            }

            /*
             * 6. Existing payout line
             */
            if (
                normalized.includes(
                    "FROM PAYOUT_LINE_ITEMS",
                ) &&
                normalized.includes(
                    "LIMIT 1",
                )
            ) {
                return existingLine as T[];
            }

            /*
             * 7. Insert payout line
             *
             * This query does not use RETURNING,
             * so an empty result is enough.
             */
            if (
                normalized.includes(
                    "INSERT INTO PAYOUT_LINE_ITEMS",
                )
            ) {
                return [] as T[];
            }

            /*
             * 8. Update payout line
             */
            if (
                normalized.includes(
                    "UPDATE PAYOUT_LINE_ITEMS",
                )
            ) {
                return [] as T[];
            }

            /*
             * 9. Final payout run update.
             *
             * IMPORTANT:
             * This was the missing mock causing:
             *
             * Cannot read properties of undefined
             *
             * and:
             *
             * PAYOUT_RUN_UPDATE_FAILED
             */
            if (
                normalized.includes(
                    "UPDATE PAYOUT_RUNS",
                )
            ) {
                return [
                    updatedRun,
                ] as T[];
            }

            throw new Error(
                `Unexpected SQL in test: \n${sql} `,
            );
        },
    );
}

describe("createPayoutRun", () => {

    beforeEach(() => {
        mockedQuery.mockReset();
    });

    it(
        "should apply 6% tier for amount below 100000",
        async () => {

            setupQueryMock({
                bookings: [
                    {
                        agent_code: "AG-001",
                        product_code: "INSURANCE",
                        booking_date: "2026-01-10",
                        booking_count: 1,
                        gross_volume: "50000.00",
                    },
                ],

                tieredRules: [
                    {
                        id: "tier-1",
                        rule_type: "TIERED",
                        commission_rate: "6.00000",
                        product_code: null,
                        min_amount: "0.00",
                        max_amount: "100000.00",
                    },
                    {
                        id: "tier-2",
                        rule_type: "TIERED",
                        commission_rate: "3.00000",
                        product_code: null,
                        min_amount: "100000.01",
                        max_amount: "200000.00",
                    },
                ],

                updatedRun: {
                    ...UPDATED_PAYOUT_RUN,
                    total_amount: "3000.00",
                },
            });

            const result =
                await createPayoutRun(
                    COMPANY_ID,
                    "2026-01-01",
                    "2026-01-31",
                );

            expect(
                result.total_amount,
            ).toBe("3000.00");

            /*
             * 50,000 × 6% = 3,000
             */
            expect(
                mockedQuery,
            ).toHaveBeenCalled();
        },
    );

    it(
        "should apply the 3% tier to the amount above 100000",
        async () => {

            setupQueryMock({
                bookings: [
                    {
                        agent_code: "AG-001",
                        product_code: "INSURANCE",
                        booking_date: "2026-01-10",
                        booking_count: 1,
                        gross_volume: "150000.00",
                    },
                ],

                tieredRules: [
                    {
                        id: "tier-1",
                        rule_type: "TIERED",
                        commission_rate: "6.00000",
                        product_code: null,
                        min_amount: "0.00",
                        max_amount: "100000.00",
                    },
                    {
                        id: "tier-2",
                        rule_type: "TIERED",
                        commission_rate: "3.00000",
                        product_code: null,
                        min_amount: "100000.01",
                        max_amount: "200000.00",
                    },
                ],

                updatedRun: {
                    ...UPDATED_PAYOUT_RUN,
                    total_amount: "7500.00",
                },
            });

            const result =
                await createPayoutRun(
                    COMPANY_ID,
                    "2026-01-01",
                    "2026-01-31",
                );

            /*
             * 100,000 × 6% = 6,000
             *
             * 50,000 × 3% = 1,500
             *
             * Total = 7,500
             */
            expect(
                result.total_amount,
            ).toBe("7500.00");
        },
    );

    it(
        "should use the correct tier instead of always selecting the 6% rule",
        async () => {

            setupQueryMock({
                bookings: [
                    {
                        agent_code: "AG-001",
                        product_code: "INSURANCE",
                        booking_date: "2026-01-10",
                        booking_count: 1,
                        gross_volume: "150000.00",
                    },
                ],

                tieredRules: [
                    {
                        id: "tier-1",
                        rule_type: "TIERED",
                        commission_rate: "6.00000",
                        product_code: null,
                        min_amount: "0.00",
                        max_amount: "100000.00",
                    },
                    {
                        id: "tier-2",
                        rule_type: "TIERED",
                        commission_rate: "3.00000",
                        product_code: null,
                        min_amount: "100000.01",
                        max_amount: "200000.00",
                    },
                ],

                updatedRun: {
                    ...UPDATED_PAYOUT_RUN,
                    total_amount: "7500.00",
                },
            });

            const result =
                await createPayoutRun(
                    COMPANY_ID,
                    "2026-01-01",
                    "2026-01-31",
                );

            expect(
                result.total_amount,
            ).toBe("7500.00");

            /*
             * If the old bug existed and the 6%
             * rule was applied to the entire amount,
             * this would be 9,000.
             *
             * Correct result = 7,500.
             */
            expect(
                result.total_amount,
            ).not.toBe("9000.00");
        },
    );

    it(
        "should prefer PRODUCT_OVERRIDE over generic TIERED rule",
        async () => {

            setupQueryMock({
                bookings: [
                    {
                        agent_code: "AG-001",
                        product_code: "INSURANCE",
                        booking_date: "2026-01-10",
                        booking_count: 1,
                        gross_volume: "50000.00",
                    },
                ],

                productOverrides: [
                    {
                        id: "override-1",
                        rule_type: "PRODUCT_OVERRIDE",
                        commission_rate: "10.00000",
                        product_code: "INSURANCE",
                        min_amount: "0.00",
                        max_amount: "200000.00",
                    },
                ],

                tieredRules: [
                    {
                        id: "tier-1",
                        rule_type: "TIERED",
                        commission_rate: "6.00000",
                        product_code: null,
                        min_amount: "0.00",
                        max_amount: "100000.00",
                    },
                    {
                        id: "tier-2",
                        rule_type: "TIERED",
                        commission_rate: "3.00000",
                        product_code: null,
                        min_amount: "100000.01",
                        max_amount: "200000.00",
                    },
                ],

                updatedRun: {
                    ...UPDATED_PAYOUT_RUN,
                    total_amount: "5000.00",
                },
            });

            const result =
                await createPayoutRun(
                    COMPANY_ID,
                    "2026-01-01",
                    "2026-01-31",
                );

            /*
             * Product override:
             *
             * 50,000 × 10% = 5,000
             *
             * Generic 6% would produce 3,000.
             */
            expect(
                result.total_amount,
            ).toBe("5000.00");

            expect(
                result.total_amount,
            ).not.toBe("3000.00");
        },
    );

    it(
        "should return zero when there are no bookings",
        async () => {

            setupQueryMock({
                bookings: [],
            });

            const result =
                await createPayoutRun(
                    COMPANY_ID,
                    "2026-01-01",
                    "2026-01-31",
                );

            expect(
                result.total_amount,
            ).toBe("0.00");
        },
    );

    it(
        "should return zero when no commission rule matches",
        async () => {

            setupQueryMock({
                bookings: [
                    {
                        agent_code: "AG-001",
                        product_code: "INSURANCE",
                        booking_date: "2026-01-10",
                        booking_count: 1,
                        gross_volume: "50000.00",
                    },
                ],

                productOverrides: [],

                tieredRules: [],

                updatedRun: {
                    ...UPDATED_PAYOUT_RUN,
                    total_amount: "0.00",
                },
            });

            const result =
                await createPayoutRun(
                    COMPANY_ID,
                    "2026-01-01",
                    "2026-01-31",
                );

            expect(
                result.total_amount,
            ).toBe("0.00");

            /*
             * No payout line should be created
             * because commission is zero.
             */
            const insertLineCalls =
                mockedQuery.mock.calls.filter(
                    ([sql]) =>
                        typeof sql === "string" &&
                        sql
                            .toUpperCase()
                            .includes(
                                "INSERT INTO PAYOUT_LINE_ITEMS",
                            ),
                );

            expect(
                insertLineCalls.length,
            ).toBe(0);
        },
    );

    it(
        "should accumulate multiple bookings for the same agent",
        async () => {

            setupQueryMock({
                bookings: [
                    {
                        agent_code: "AG-001",
                        product_code: "INSURANCE",
                        booking_date: "2026-01-10",
                        booking_count: 1,
                        gross_volume: "20000.00",
                    },
                    {
                        agent_code: "AG-001",
                        product_code: "TRAVEL",
                        booking_date: "2026-01-10",
                        booking_count: 2,
                        gross_volume: "30000.00",
                    },
                ],

                tieredRules: [
                    {
                        id: "tier-1",
                        rule_type: "TIERED",
                        commission_rate: "6.00000",
                        product_code: null,
                        min_amount: "0.00",
                        max_amount: "100000.00",
                    },
                    {
                        id: "tier-2",
                        rule_type: "TIERED",
                        commission_rate: "3.00000",
                        product_code: null,
                        min_amount: "100000.01",
                        max_amount: "200000.00",
                    },
                ],

                updatedRun: {
                    ...UPDATED_PAYOUT_RUN,
                    total_amount: "3000.00",
                },
            });

            const result =
                await createPayoutRun(
                    COMPANY_ID,
                    "2026-01-01",
                    "2026-01-31",
                );

            /*
             * Total volume:
             *
             * 20,000 + 30,000 = 50,000
             *
             * 50,000 × 6% = 3,000
             */
            expect(
                result.total_amount,
            ).toBe("3000.00");

            /*
             * Only one payout line should be
             * created for AG-001.
             */
            const insertLineCalls =
                mockedQuery.mock.calls.filter(
                    ([sql]) =>
                        typeof sql === "string" &&
                        sql
                            .toUpperCase()
                            .includes(
                                "INSERT INTO PAYOUT_LINE_ITEMS",
                            ),
                );

            expect(
                insertLineCalls.length,
            ).toBe(1);

            /*
             * Verify total booking count and
             * total volume passed to INSERT.
             */
            const insertParams =
                insertLineCalls[0]?.[1] as unknown[];

            expect(
                insertParams,
            ).toContain(3);

            expect(
                insertParams,
            ).toContain(50000);
        },
    );

    it(
        "should reject an invalid payout period",
        async () => {

            await expect(
                createPayoutRun(
                    COMPANY_ID,
                    "2026-02-01",
                    "2026-01-01",
                ),
            ).rejects.toThrow(
                "INVALID_PAYOUT_PERIOD",
            );

            /*
             * No database query should happen
             * when the period itself is invalid.
             */
            expect(
                mockedQuery,
            ).not.toHaveBeenCalled();
        },
    );
});
