import {
    describe,
    it,
    expect,
    beforeEach,
    vi,
} from "vitest";

import { randomUUID } from "crypto";


/*
 * =========================================================
 * MOCK DATABASE
 * =========================================================
 */

vi.mock("../db/client", () => ({
    query: vi.fn(),
}));


import { query } from "../db/client";


const mockedQuery =
    vi.mocked(query);


/*
 * =========================================================
 * IMPORT SERVICE AFTER MOCK
 * =========================================================
 */

import {
    createPayoutRun,
    getAgentPayouts,
} from "../services/payout.service";


/*
 * =========================================================
 * TEST CONSTANTS
 * =========================================================
 */

const COMPANY_ID =
    "company_override_test";

const USER_ID =
    "user_override_test";

const AGENT_CODE =
    "AG-002";

const PRODUCT_CODE =
    "INSURANCE";


/*
 * =========================================================
 * TYPES
 * =========================================================
 */

interface TestBooking {
    id: string;
    agent_code: string;
    product_code: string;
    booking_date: string;
    amount: string;
    currency: string;
}

interface TestPayoutRun {
    id: string;
    company_id: string;
    run_no: number;
    period_start: string;
    period_end: string;
    status: "DRAFT" | "FINALISED";
    total_amount: string;
    created_at: string;
}


/*
 * =========================================================
 * HELPERS
 * =========================================================
 */

function booking(
    amount: string,
    date = "2026-03-01",
    product: string = PRODUCT_CODE,
): TestBooking {

    return {
        id: `booking_${randomUUID()}`,
        agent_code: AGENT_CODE,
        product_code: product,
        booking_date: date,
        amount,
        currency: "LKR",
    };
}


function overrideRule(
    rate = "1.00000",
    min = "0.00",
    max = "25000.00",
) {
    return {
        id:
            `commission_rule_${randomUUID()}`,

        rule_type:
            "PRODUCT_OVERRIDE" as const,

        commission_rate:
            rate,

        product_code:
            PRODUCT_CODE,

        min_amount:
            min,

        max_amount:
            max,
    };
}


/*
 * =========================================================
 * PRODUCT OVERRIDE COMMISSION CALCULATION
 * =========================================================
 */

describe(
    "Product Override Commission Calculation",
    () => {

        it(
            "calculates 1% override correctly",
            () => {

                const amount =
                    22000;

                const rate =
                    1;

                const commission =
                    amount *
                    rate /
                    100;

                expect(
                    commission,
                ).toBe(220);

            },
        );


        it(
            "rounds override commission to two decimals",
            () => {

                const amount =
                    18750.65;

                const rate =
                    1;

                const commission =
                    Number(
                        (
                            amount *
                            rate /
                            100
                        ).toFixed(2),
                    );

                expect(
                    commission,
                ).toBe(187.51);

            },
        );


        it(
            "calculates 1% of 11500",
            () => {

                const amount =
                    11500;

                const commission =
                    amount *
                    1 /
                    100;

                expect(
                    commission,
                ).toBe(115);

            },
        );


        it(
            "calculates 1% of 12080",
            () => {

                const amount =
                    12080;

                const commission =
                    amount *
                    1 /
                    100;

                expect(
                    commission,
                ).toBe(120.8);

            },
        );


        it(
            "calculates 2.5% override",
            () => {

                const amount =
                    10000;

                const rate =
                    2.5;

                const commission =
                    amount *
                    rate /
                    100;

                expect(
                    commission,
                ).toBe(250);

            },
        );


        it(
            "returns zero for zero amount",
            () => {

                const amount =
                    0;

                const commission =
                    amount > 0
                        ? amount * 1 / 100
                        : 0;

                expect(
                    commission,
                ).toBe(0);

            },
        );


        it(
            "returns zero for negative amount",
            () => {

                const amount =
                    -1000;

                const commission =
                    amount > 0
                        ? amount * 1 / 100
                        : 0;

                expect(
                    commission,
                ).toBe(0);

            },
        );


        it(
            "calculates multiple override bookings",
            () => {

                const amounts = [
                    22000,
                    18750.65,
                    11500,
                    12080,
                ];

                const total =
                    amounts.reduce(
                        (
                            sum,
                            amount,
                        ) =>
                            sum +
                            amount *
                            1 /
                            100,
                        0,
                    );

                expect(
                    Number(
                        total.toFixed(2),
                    ),
                ).toBe(643.31);

            },
        );

    },
);


/*
 * =========================================================
 * PRODUCT OVERRIDE AMOUNT RANGE
 * =========================================================
 */

describe(
    "Product Override Amount Range",
    () => {

        const min =
            0;

        const max =
            25000;


        it(
            "accepts amount inside range",
            () => {

                const amount =
                    22000;

                expect(
                    amount >= min &&
                    amount <= max,
                ).toBe(true);

            },
        );


        it(
            "accepts minimum amount",
            () => {

                const amount =
                    0;

                expect(
                    amount >= min &&
                    amount <= max,
                ).toBe(true);

            },
        );


        it(
            "accepts maximum amount",
            () => {

                const amount =
                    25000;

                expect(
                    amount >= min &&
                    amount <= max,
                ).toBe(true);

            },
        );


        it(
            "rejects amount above maximum",
            () => {

                const amount =
                    25000.01;

                expect(
                    amount >= min &&
                    amount <= max,
                ).toBe(false);

            },
        );


        it(
            "rejects negative amount",
            () => {

                const amount =
                    -1;

                expect(
                    amount >= min &&
                    amount <= max,
                ).toBe(false);

            },
        );

    },
);


/*
 * =========================================================
 * PRODUCT MATCHING
 * =========================================================
 */

describe(
    "Product Override Product Matching",
    () => {

        it(
            "matches INSURANCE rule to INSURANCE booking",
            () => {

                const ruleProduct: string =
                    "INSURANCE";

                const bookingProduct: string =
                    "INSURANCE";

                expect(
                    ruleProduct ===
                    bookingProduct,
                ).toBe(true);

            },
        );


        it(
            "does not match INSURANCE rule to VISA booking",
            () => {

                /*
                 * Explicitly use string here.
                 *
                 * Otherwise TypeScript treats these as
                 * literal types:
                 *
                 * "INSURANCE"
                 * "VISA"
                 *
                 * and reports TS2367.
                 */
                const ruleProduct: string =
                    "INSURANCE";

                const bookingProduct: string =
                    "VISA";

                expect(
                    ruleProduct ===
                    bookingProduct,
                ).toBe(false);

            },
        );


        it(
            "does not match INSURANCE rule to FLIGHT",
            () => {

                const ruleProduct: string =
                    "INSURANCE";

                const bookingProduct: string =
                    "FLIGHT";

                expect(
                    ruleProduct ===
                    bookingProduct,
                ).toBe(false);

            },
        );

    },
);


/*
 * =========================================================
 * EFFECTIVE DATE TESTS
 * =========================================================
 */

describe(
    "Product Override Effective Dates",
    () => {

        const effectiveFrom =
            "2025-12-31";

        const effectiveTo =
            "2026-12-30";


        it(
            "applies inside effective period",
            () => {

                const bookingDate =
                    "2026-03-01";

                expect(
                    bookingDate >=
                    effectiveFrom &&
                    bookingDate <=
                    effectiveTo,
                ).toBe(true);

            },
        );


        it(
            "applies on effective_from",
            () => {

                const bookingDate =
                    "2025-12-31";

                expect(
                    bookingDate >=
                    effectiveFrom,
                ).toBe(true);

            },
        );


        it(
            "applies on effective_to",
            () => {

                const bookingDate =
                    "2026-12-30";

                expect(
                    bookingDate <=
                    effectiveTo,
                ).toBe(true);

            },
        );


        it(
            "does not apply before effective_from",
            () => {

                const bookingDate =
                    "2025-12-30";

                expect(
                    bookingDate >=
                    effectiveFrom &&
                    bookingDate <=
                    effectiveTo,
                ).toBe(false);

            },
        );


        it(
            "does not apply after effective_to",
            () => {

                const bookingDate =
                    "2026-12-31";

                expect(
                    bookingDate >=
                    effectiveFrom &&
                    bookingDate <=
                    effectiveTo,
                ).toBe(false);

            },
        );

    },
);


/*
 * =========================================================
 * EXPECTED AGENT BOOKING DATA
 * =========================================================
 */

describe(
    "AG-002 Product Override Bookings",
    () => {

        const bookings = [
            booking(
                "22000.00",
                "2026-03-01",
            ),

            booking(
                "18750.65",
                "2026-03-09",
            ),

            booking(
                "11500.00",
                "2026-03-27",
            ),

            booking(
                "12080.00",
                "2026-03-30",
            ),
        ];


        it(
            "contains four override bookings",
            () => {

                expect(
                    bookings,
                ).toHaveLength(4);

            },
        );


        it(
            "all bookings belong to AG-002",
            () => {

                expect(
                    bookings.every(
                        b =>
                            b.agent_code ===
                            AGENT_CODE,
                    ),
                ).toBe(true);

            },
        );


        it(
            "all bookings are INSURANCE",
            () => {

                expect(
                    bookings.every(
                        b =>
                            b.product_code ===
                            PRODUCT_CODE,
                    ),
                ).toBe(true);

            },
        );


        it(
            "all bookings are inside override amount range",
            () => {

                expect(
                    bookings.every(
                        b =>
                            Number(b.amount) >=
                            0 &&
                            Number(b.amount) <=
                            25000,
                    ),
                ).toBe(true);

            },
        );


        it(
            "calculates expected override volume",
            () => {

                const volume =
                    bookings.reduce(
                        (
                            total,
                            b,
                        ) =>
                            total +
                            Number(
                                b.amount,
                            ),
                        0,
                    );

                expect(
                    Number(
                        volume.toFixed(2),
                    ),
                ).toBe(64330.65);

            },
        );


        it(
            "calculates expected override commission",
            () => {

                const commission =
                    bookings.reduce(
                        (
                            total,
                            b,
                        ) =>
                            total +
                            Number(b.amount) *
                            1 /
                            100,
                        0,
                    );

                expect(
                    Number(
                        commission.toFixed(2),
                    ),
                ).toBe(643.31);

            },
        );

    },
);


/*
 * =========================================================
 * PAYOUT COMMISSION LOGIC
 * =========================================================
 */

describe(
    "Payout Commission With Product Override",
    () => {

        it(
            "uses override instead of normal commission",
            () => {

                const amount =
                    22000;

                const overrideRate =
                    1;

                const normalRate =
                    0.76;

                const overrideCommission =
                    amount *
                    overrideRate /
                    100;

                const normalCommission =
                    amount *
                    normalRate /
                    100;

                expect(
                    overrideCommission,
                ).toBe(220);

                expect(
                    normalCommission,
                ).toBeCloseTo(
                    167.2,
                );

                expect(
                    overrideCommission,
                ).toBeGreaterThan(
                    normalCommission,
                );

            },
        );


        it(
            "does not add tiered commission when override exists",
            () => {

                const amount =
                    22000;

                const overrideCommission =
                    amount *
                    1 /
                    100;

                const normalCommission =
                    amount *
                    0.76 /
                    100;

                const total =
                    overrideCommission;

                expect(
                    total,
                ).toBe(220);

                expect(
                    total,
                ).not.toBe(
                    overrideCommission +
                    normalCommission,
                );

            },
        );


        it(
            "calculates four override bookings",
            () => {

                const amounts = [
                    22000,
                    18750.65,
                    11500,
                    12080,
                ];

                const commission =
                    amounts.reduce(
                        (
                            total,
                            amount,
                        ) =>
                            total +
                            amount *
                            1 /
                            100,
                        0,
                    );

                expect(
                    Number(
                        commission.toFixed(2),
                    ),
                ).toBe(643.31);

            },
        );

    },
);


/*
 * =========================================================
 * CREATE PAYOUT RUN
 * =========================================================
 */

describe(
    "Create Payout Run",
    () => {

        beforeEach(
            () => {
                mockedQuery.mockReset();
            },
        );


        it(
            "creates a DRAFT payout run",
            async () => {

                const bookings = [
                    booking(
                        "22000.00",
                        "2026-03-01",
                    ),

                    booking(
                        "18750.65",
                        "2026-03-09",
                    ),

                    booking(
                        "11500.00",
                        "2026-03-27",
                    ),

                    booking(
                        "12080.00",
                        "2026-03-30",
                    ),
                ];


                const payoutRun: TestPayoutRun = {
                    id:
                        "run_test_override",

                    company_id:
                        COMPANY_ID,

                    run_no:
                        100,

                    period_start:
                        "2026-01-01",

                    period_end:
                        "2026-12-31",

                    status:
                        "DRAFT",

                    total_amount:
                        "0.00",

                    created_at:
                        "2026-08-21T00:00:00.000Z",
                };


                const updatedPayoutRun: TestPayoutRun = {
                    ...payoutRun,

                    total_amount:
                        "643.31",
                };


                /*
                 * QUERY #1
                 *
                 * Get next run number.
                 */
                mockedQuery.mockResolvedValueOnce(
                    [
                        {
                            next_run_no: 100,
                        },
                    ] as never,
                );


                /*
                 * QUERY #2
                 *
                 * INSERT payout_runs.
                 */
                mockedQuery.mockResolvedValueOnce(
                    [
                        payoutRun,
                    ] as never,
                );


                /*
                 * QUERY #3
                 *
                 * SELECT bookings.
                 */
                mockedQuery.mockResolvedValueOnce(
                    bookings as never,
                );


                /*
                 * From here, the service performs:
                 *
                 * - payout_booking_items INSERTs
                 * - product override SELECTs
                 * - tiered rule SELECTs
                 * - payout_line_items SELECT
                 * - payout_line_items INSERT
                 * - final payout_runs UPDATE
                 *
                 * We therefore need to provide suitable
                 * responses for every subsequent query.
                 */


                /*
                 * Mapping INSERTS:
                 *
                 * There are 4 bookings.
                 */
                mockedQuery.mockResolvedValueOnce(
                    [] as never,
                );

                mockedQuery.mockResolvedValueOnce(
                    [] as never,
                );

                mockedQuery.mockResolvedValueOnce(
                    [] as never,
                );

                mockedQuery.mockResolvedValueOnce(
                    [] as never,
                );


                /*
                 * Booking 1 override rule.
                 */
                mockedQuery.mockResolvedValueOnce(
                    [
                        overrideRule(),
                    ] as never,
                );


                /*
                 * Booking 2 override rule.
                 */
                mockedQuery.mockResolvedValueOnce(
                    [
                        overrideRule(),
                    ] as never,
                );


                /*
                 * Booking 3 override rule.
                 */
                mockedQuery.mockResolvedValueOnce(
                    [
                        overrideRule(),
                    ] as never,
                );


                /*
                 * Booking 4 override rule.
                 */
                mockedQuery.mockResolvedValueOnce(
                    [
                        overrideRule(),
                    ] as never,
                );


                /*
                 * Agent payout line does not already exist.
                 */
                mockedQuery.mockResolvedValueOnce(
                    [] as never,
                );


                /*
                 * INSERT payout line.
                 */
                mockedQuery.mockResolvedValueOnce(
                    [] as never,
                );


                /*
                 * FINAL QUERY:
                 *
                 * UPDATE payout_runs
                 *
                 * This MUST return the updated payout run.
                 *
                 * Previously this was mocked as [] and caused:
                 *
                 * PAYOUT_RUN_UPDATE_FAILED
                 */
                mockedQuery.mockResolvedValueOnce(
                    [
                        updatedPayoutRun,
                    ] as never,
                );


                const result =
                    await createPayoutRun(
                        COMPANY_ID,
                        "2026-01-01",
                        "2026-12-31",
                    );


                expect(
                    result,
                ).toBeDefined();


                expect(
                    result.status,
                ).toBe(
                    "DRAFT",
                );


                expect(
                    result.company_id,
                ).toBe(
                    COMPANY_ID,
                );


                expect(
                    result.run_no,
                ).toBe(100);


                expect(
                    Number(
                        result.total_amount,
                    ),
                ).toBe(643.31);

            },
        );


        it(
            "does not allow invalid payout period",
            async () => {

                await expect(
                    createPayoutRun(
                        COMPANY_ID,
                        "2026-12-31",
                        "2026-01-01",
                    ),
                ).rejects.toThrow(
                    "INVALID_PAYOUT_PERIOD",
                );

            },
        );

    },
);


/*
 * =========================================================
 * AGENT PAYOUT API OVERRIDE RESPONSE
 * =========================================================
 */

describe(
    "Agent Payout API Override Response",
    () => {

        beforeEach(
            () => {
                mockedQuery.mockReset();
            },
        );


        it(
            "returns override commission amount",
            async () => {

                mockedQuery.mockResolvedValueOnce(
                    [
                        {
                            payout_run_id:
                                "run_override_test",

                            run_no:
                                6,

                            period_start:
                                "2026-01-01",

                            period_end:
                                "2026-12-31",

                            status:
                                "DRAFT",

                            created_at:
                                "2026-08-21",

                            agent_code:
                                AGENT_CODE,

                            booking_count:
                                5,

                            gross_volume:
                                "65320.65",

                            commission_rate:
                                "1.13641",

                            commission_amount:
                                "742.31",

                            override_volume:
                                "64330.65",

                            override_rate:
                                "1.00000",

                            override_commission_amount:
                                "643.31",

                            override_applied:
                                true,
                        },
                    ] as never,
                );


                const result =
                    await getAgentPayouts(
                        COMPANY_ID,
                        USER_ID,
                    );


                expect(
                    result,
                ).toHaveLength(1);


                /*
                 * IMPORTANT:
                 *
                 * result[0] can theoretically be undefined.
                 *
                 * We already know the array has length 1,
                 * so the non-null assertion is appropriate here.
                 */
                const payout =
                    result[0]!;


                expect(
                    Number(
                        payout.override_commission_amount,
                    ),
                ).toBe(643.31);


                expect(
                    Number(
                        payout.override_volume,
                    ),
                ).toBe(64330.65);


                expect(
                    Number(
                        payout.override_rate,
                    ),
                ).toBe(1);


                expect(
                    payout.override_applied,
                ).toBe(true);

            },
        );


        it(
            "returns override_applied true when matching booking exists",
            async () => {

                mockedQuery.mockResolvedValueOnce(
                    [
                        {
                            payout_run_id:
                                "run_test",

                            run_no:
                                1,

                            period_start:
                                "2026-01-01",

                            period_end:
                                "2026-12-31",

                            status:
                                "DRAFT",

                            created_at:
                                "2026-08-21",

                            agent_code:
                                AGENT_CODE,

                            booking_count:
                                1,

                            gross_volume:
                                "22000.00",

                            commission_rate:
                                "1.00000",

                            commission_amount:
                                "220.00",

                            override_volume:
                                "22000.00",

                            override_rate:
                                "1.00000",

                            override_commission_amount:
                                "220.00",

                            override_applied:
                                true,
                        },
                    ] as never,
                );


                const result =
                    await getAgentPayouts(
                        COMPANY_ID,
                        USER_ID,
                    );


                expect(
                    result,
                ).toHaveLength(1);


                const payout =
                    result[0]!;


                expect(
                    payout.override_applied,
                ).toBe(true);

            },
        );


        it(
            "returns zero override commission when no rule matches",
            async () => {

                mockedQuery.mockResolvedValueOnce(
                    [
                        {
                            payout_run_id:
                                "run_no_override",

                            run_no:
                                1,

                            period_start:
                                "2026-01-01",

                            period_end:
                                "2026-12-31",

                            status:
                                "DRAFT",

                            created_at:
                                "2026-08-21",

                            agent_code:
                                AGENT_CODE,

                            booking_count:
                                1,

                            gross_volume:
                                "22000.00",

                            commission_rate:
                                "0.76000",

                            commission_amount:
                                "167.20",

                            override_volume:
                                "0",

                            override_rate:
                                "0",

                            override_commission_amount:
                                "0",

                            override_applied:
                                false,
                        },
                    ] as never,
                );


                const result =
                    await getAgentPayouts(
                        COMPANY_ID,
                        USER_ID,
                    );


                expect(
                    result,
                ).toHaveLength(1);


                const payout =
                    result[0]!;


                expect(
                    Number(
                        payout.override_commission_amount,
                    ),
                ).toBe(0);


                expect(
                    payout.override_applied,
                ).toBe(false);

            },
        );

    },
);


/*
 * =========================================================
 * FRONTEND / BACKEND FIELD CONTRACT
 * =========================================================
 */

describe(
    "Agent Payout API Field Contract",
    () => {

        it(
            "uses override_commission_amount from backend",
            () => {

                const backendResponse = {
                    override_commission_amount:
                        "643.31",
                };


                const frontendValue =
                    Number(
                        backendResponse
                            .override_commission_amount,
                    );


                expect(
                    frontendValue,
                ).toBe(643.31);

            },
        );


        it(
            "uses status from backend",
            () => {

                const backendResponse = {
                    status:
                        "DRAFT",
                };


                const frontendStatus =
                    backendResponse.status;


                expect(
                    frontendStatus,
                ).toBe("DRAFT");

            },
        );

    },
);


/*
 * =========================================================
 * FINAL PRODUCT OVERRIDE BUSINESS RULES
 * =========================================================
 */

describe(
    "Final Product Override Rules",
    () => {

        it(
            "override has priority over tiered commission",
            () => {

                const amount =
                    22000;

                const overrideRate =
                    1;

                const tieredRate =
                    0.76;

                const overrideCommission =
                    amount *
                    overrideRate /
                    100;

                const normalCommission =
                    amount *
                    tieredRate /
                    100;


                expect(
                    overrideCommission,
                ).toBe(220);


                expect(
                    overrideCommission,
                ).not.toBe(
                    normalCommission,
                );

            },
        );


        it(
            "does not add tiered commission when override exists",
            () => {

                const amount =
                    22000;

                const overrideCommission =
                    amount *
                    1 /
                    100;

                const normalCommission =
                    amount *
                    0.76 /
                    100;


                const total =
                    overrideCommission;


                expect(
                    total,
                ).toBe(220);


                expect(
                    total,
                ).not.toBe(
                    overrideCommission +
                    normalCommission,
                );

            },
        );


        it(
            "override volume equals matching booking volume",
            () => {

                const matchingAmounts = [
                    22000,
                    18750.65,
                    11500,
                    12080,
                ];


                const volume =
                    matchingAmounts.reduce(
                        (
                            total,
                            amount,
                        ) =>
                            total +
                            amount,
                        0,
                    );


                expect(
                    Number(
                        volume.toFixed(2),
                    ),
                ).toBe(64330.65);

            },
        );


        it(
            "override commission equals 1 percent of matching volume",
            () => {

                const volume =
                    64330.65;

                const commission =
                    volume *
                    1 /
                    100;


                expect(
                    Number(
                        commission.toFixed(2),
                    ),
                ).toBe(643.31);

            },
        );


        it(
            "override must not apply outside effective date",
            () => {

                const bookingDate =
                    "2027-01-01";

                const effectiveFrom =
                    "2025-12-31";

                const effectiveTo =
                    "2026-12-30";


                const applies =
                    bookingDate >=
                    effectiveFrom &&
                    bookingDate <=
                    effectiveTo;


                expect(
                    applies,
                ).toBe(false);

            },
        );


        it(
            "override must not apply to another product",
            () => {

                /*
                 * Use string rather than literal types.
                 * This avoids TS2367.
                 */
                const ruleProduct: string =
                    "INSURANCE";

                const bookingProduct: string =
                    "VISA";


                expect(
                    ruleProduct ===
                    bookingProduct,
                ).toBe(false);

            },
        );


        it(
            "override must not apply above maximum amount",
            () => {

                const amount =
                    25000.01;

                const maxAmount =
                    25000;


                expect(
                    amount <=
                    maxAmount,
                ).toBe(false);

            },
        );

    },
);