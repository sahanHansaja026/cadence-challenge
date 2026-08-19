import { describe, expect, it, vi, beforeEach } from "vitest";



import { query } from "../db/client";
import { createExchangeRate, getExchangeRateForDate, getExchangeRates } from "../services/exchange-rate.service";

vi.mock("../db/client", () => ({
    query: vi.fn(),
}));

const mockedQuery =
    vi.mocked(query);

describe("Exchange Rate Service", () => {

    beforeEach(() => {
        vi.clearAllMocks();
    });


    describe("createExchangeRate", () => {

        it("creates an exchange rate successfully", async () => {

            mockedQuery
                .mockResolvedValueOnce([])
                .mockResolvedValueOnce([
                    {
                        id: "exchange_rate_test",
                        effective_from: "2026-02-02",
                        currency: "USD",
                        rate_to_lkr: "318.4000",
                        source: "CBSL weekly",
                        created_at: "2026-08-19T00:00:00.000Z",
                    },
                ]);

            const result =
                await createExchangeRate({
                    effectiveFrom: "2026-02-02",
                    currency: "USD",
                    rateToLkr: "318.40",
                    source: "CBSL weekly",
                });

            expect(result.currency).toBe("USD");
            expect(result.rate_to_lkr).toBe("318.4000");

            expect(mockedQuery)
                .toHaveBeenCalledTimes(2);
        });


        it("rejects duplicate currency rate for the same date", async () => {

            mockedQuery
                .mockResolvedValueOnce([
                    {
                        id: "exchange_rate_existing",
                    },
                ]);

            await expect(
                createExchangeRate({
                    effectiveFrom: "2026-02-02",
                    currency: "USD",
                    rateToLkr: "318.40",
                    source: "CBSL weekly",
                }),
            ).rejects.toThrow(
                "EXCHANGE_RATE_ALREADY_EXISTS",
            );

            expect(mockedQuery)
                .toHaveBeenCalledTimes(1);
        });


        it("throws when exchange rate creation returns no row", async () => {

            mockedQuery
                .mockResolvedValueOnce([])
                .mockResolvedValueOnce([]);

            await expect(
                createExchangeRate({
                    effectiveFrom: "2026-02-02",
                    currency: "USD",
                    rateToLkr: "318.40",
                    source: "CBSL weekly",
                }),
            ).rejects.toThrow(
                "EXCHANGE_RATE_CREATION_FAILED",
            );
        });

    });


    describe("getExchangeRates", () => {

        it("returns all exchange rates", async () => {

            mockedQuery.mockResolvedValueOnce([
                {
                    id: "rate_1",
                    effective_from: "2026-02-16",
                    currency: "USD",
                    rate_to_lkr: "317.8000",
                    source: "CBSL weekly",
                    created_at: "2026-08-19T00:00:00.000Z",
                },
                {
                    id: "rate_2",
                    effective_from: "2026-02-09",
                    currency: "USD",
                    rate_to_lkr: "319.1500",
                    source: "CBSL weekly",
                    created_at: "2026-08-19T00:00:00.000Z",
                },
            ]);

            const result =
                await getExchangeRates();

            expect(result).toHaveLength(2);

            expect(result[0]?.currency)
                .toBe("USD");

            expect(result[1]?.rate_to_lkr)
                .toBe("319.1500");

            expect(mockedQuery)
                .toHaveBeenCalledTimes(1);
        });

    });


    describe("getExchangeRateForDate", () => {

        it("returns null for LKR because no conversion is required", async () => {

            const result =
                await getExchangeRateForDate(
                    "LKR",
                    "2026-02-20",
                );

            expect(result).toBeNull();

            /*
             * Database should not be queried
             * for LKR.
             */
            expect(mockedQuery)
                .not.toHaveBeenCalled();
        });


        it("returns the latest rate effective on or before the booking date", async () => {

            mockedQuery.mockResolvedValueOnce([
                {
                    id: "rate_20260216_usd",
                    effective_from: "2026-02-16",
                    currency: "USD",
                    rate_to_lkr: "317.8000",
                    source: "CBSL weekly",
                    created_at: "2026-08-19T00:00:00.000Z",
                },
            ]);

            const result =
                await getExchangeRateForDate(
                    "USD",
                    "2026-02-20",
                );

            expect(result).not.toBeNull();

            expect(result?.effective_from)
                .toBe("2026-02-16");

            expect(result?.rate_to_lkr)
                .toBe("317.8000");
        });


        it("uses the rate on the exact effective date", async () => {

            mockedQuery.mockResolvedValueOnce([
                {
                    id: "rate_20260216_usd",
                    effective_from: "2026-02-16",
                    currency: "USD",
                    rate_to_lkr: "317.8000",
                    source: "CBSL weekly",
                    created_at: "2026-08-19T00:00:00.000Z",
                },
            ]);

            const result =
                await getExchangeRateForDate(
                    "USD",
                    "2026-02-16",
                );

            expect(result?.rate_to_lkr)
                .toBe("317.8000");
        });


        it("returns null when no applicable rate exists", async () => {

            mockedQuery.mockResolvedValueOnce([]);

            const result =
                await getExchangeRateForDate(
                    "USD",
                    "2026-01-01",
                );

            expect(result).toBeNull();
        });


        it("queries using the requested currency and booking date", async () => {

            mockedQuery.mockResolvedValueOnce([]);

            await getExchangeRateForDate(
                "USD",
                "2026-02-20",
            );

            expect(mockedQuery)
                .toHaveBeenCalledWith(
                    expect.stringContaining(
                        "effective_from <= $2::date",
                    ),
                    [
                        "USD",
                        "2026-02-20",
                    ],
                );
        });

    });

});