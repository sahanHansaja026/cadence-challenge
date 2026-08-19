import { describe, expect, it, vi, beforeEach } from "vitest";

import {
    createPayoutRun,
    getPayoutRuns,
    getPayoutRunById,
    getPayoutLineItems,
    getAgentPayouts,
} from "./payout.service";

import { query } from "../db/client";

vi.mock("../db/client", () => ({
    query: vi.fn(),
}));

const mockedQuery = vi.mocked(query);

describe("payout.service", () => {

    beforeEach(() => {
        vi.clearAllMocks();
    });


    describe("createPayoutRun", () => {

        it("rejects an invalid payout period", async () => {

            await expect(
                createPayoutRun(
                    "mad-marketing",
                    "2026-08-31",
                    "2026-08-01",
                ),
            ).rejects.toThrow(
                "INVALID_PAYOUT_PERIOD",
            );

            expect(
                mockedQuery,
            ).not.toHaveBeenCalled();

        });


        it("creates a payout run with zero when there are no bookings", async () => {

            mockedQuery
                .mockResolvedValueOnce([
                    {
                        next_run_no: 3,
                    },
                ])
                .mockResolvedValueOnce([
                    {
                        id: "run-test",
                        company_id: "mad-marketing",
                        run_no: 3,
                        period_start: "2026-08-01",
                        period_end: "2026-08-31",
                        status: "DRAFT",
                        total_amount: "0.00",
                        created_at: "2026-08-18",
                    },
                ])
                .mockResolvedValueOnce([]);

            const result =
                await createPayoutRun(
                    "mad-marketing",
                    "2026-08-01",
                    "2026-08-31",
                );

            expect(result).toEqual(
                expect.objectContaining({
                    id: "run-test",
                    company_id: "mad-marketing",
                    run_no: 3,
                    status: "DRAFT",
                    total_amount: "0.00",
                }),
            );

        });


        it("creates commission for active bookings", async () => {

            mockedQuery
                // next run number
                .mockResolvedValueOnce([
                    {
                        next_run_no: 3,
                    },
                ])

                // create payout run
                .mockResolvedValueOnce([
                    {
                        id: "run-test",
                        company_id: "mad-marketing",
                        run_no: 3,
                        period_start: "2026-08-01",
                        period_end: "2026-08-31",
                        status: "DRAFT",
                        total_amount: "0.00",
                        created_at: "2026-08-18",
                    },
                ])

                // bookings
                .mockResolvedValueOnce([
                    {
                        agent_code: "AG-001",
                        product_code: "HOTEL",
                        booking_count: 2,
                        gross_volume: "100000.00",
                    },
                ])

                // commission rule
                .mockResolvedValueOnce([
                    {
                        id: "rule-1",
                        commission_rate: "5",
                    },
                ])

                // existing payout line
                .mockResolvedValueOnce([])

                // insert payout line
                .mockResolvedValueOnce([])

                // update payout total
                .mockResolvedValueOnce([
                    {
                        id: "run-test",
                        company_id: "mad-marketing",
                        run_no: 3,
                        period_start: "2026-08-01",
                        period_end: "2026-08-31",
                        status: "DRAFT",
                        total_amount: "5000.00",
                        created_at: "2026-08-18",
                    },
                ]);


            const result =
                await createPayoutRun(
                    "mad-marketing",
                    "2026-08-01",
                    "2026-08-31",
                );


            expect(
                result.total_amount,
            ).toBe("5000.00");

        });

    });


    describe("getPayoutRuns", () => {

        it("returns only payout runs for the company", async () => {

            mockedQuery.mockResolvedValueOnce([
                {
                    id: "run-1",
                    company_id: "mad-marketing",
                    run_no: 1,
                    period_start: "2026-08-01",
                    period_end: "2026-08-31",
                    status: "DRAFT",
                    total_amount: "5000.00",
                    created_at: "2026-08-18",
                },
            ]);

            const result =
                await getPayoutRuns(
                    "mad-marketing",
                );

            expect(result).toHaveLength(1);

            expect(
                mockedQuery,
            ).toHaveBeenCalledWith(
                expect.stringContaining(
                    "WHERE company_id = $1",
                ),
                ["mad-marketing"],
            );

        });

    });


    describe("getPayoutRunById", () => {

        it("does not return a payout run from another company", async () => {

            mockedQuery.mockResolvedValueOnce([]);

            const result =
                await getPayoutRunById(
                    "run-1",
                    "mad-marketing",
                );

            expect(result).toBeNull();

            expect(
                mockedQuery,
            ).toHaveBeenCalledWith(
                expect.stringContaining(
                    "AND company_id = $2",
                ),
                [
                    "run-1",
                    "mad-marketing",
                ],
            );

        });

    });


    describe("getAgentPayouts", () => {

        it("scopes agent payouts to the authenticated user and company", async () => {

            mockedQuery.mockResolvedValueOnce([]);

            const result =
                await getAgentPayouts(
                    "mad-marketing",
                    "user-123",
                );

            expect(result).toEqual([]);

            expect(
                mockedQuery,
            ).toHaveBeenCalledWith(
                expect.stringContaining(
                    "WHERE a.user_id = $1",
                ),
                [
                    "user-123",
                    "mad-marketing",
                ],
            );

        });

    });

});