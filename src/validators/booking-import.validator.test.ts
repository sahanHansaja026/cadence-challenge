import {
    describe,
    expect,
    it,
} from "vitest";

import {
    convertDate,
    isValidAmount,
    isValidCurrency,
    validateBookingRow,
} from "./booking-import.validator";


const validRow = {
    external_ref: "BK-001",
    agent_code: "AG-001",
    date: "03/04/2026",
    amount: "5000.00",
    currency: "LKR",
    product_code: "TRAVEL",
};


/*
 * =========================================================
 * convertDate
 * =========================================================
 */

describe("convertDate", () => {

    it("converts DD/MM/YYYY to YYYY-MM-DD", () => {

        expect(
            convertDate("03/04/2026"),
        ).toBe("2026-04-03");

    });


    it("interprets 03/04/2026 as 3 April 2026", () => {

        expect(
            convertDate("03/04/2026"),
        ).toBe("2026-04-03");

    });


    it("accepts single digit day and month", () => {

        expect(
            convertDate("3/4/2026"),
        ).toBe("2026-04-03");

    });


    it("rejects impossible dates", () => {

        expect(
            convertDate("31/02/2026"),
        ).toBeNull();

    });


    it("rejects invalid date format", () => {

        expect(
            convertDate("2026-04-03"),
        ).toBeNull();

    });


    it("rejects invalid month", () => {

        expect(
            convertDate("03/13/2026"),
        ).toBeNull();

    });


    it("rejects invalid day", () => {

        expect(
            convertDate("32/01/2026"),
        ).toBeNull();

    });


    it("rejects invalid leap year date", () => {

        expect(
            convertDate("29/02/2025"),
        ).toBeNull();

    });


    it("accepts valid leap year date", () => {

        expect(
            convertDate("29/02/2024"),
        ).toBe("2024-02-29");

    });

});


/*
 * =========================================================
 * isValidAmount
 * =========================================================
 */

describe("isValidAmount", () => {

    it("accepts a whole positive amount", () => {

        expect(
            isValidAmount("5000"),
        ).toBe(true);

    });


    it("accepts one decimal place", () => {

        expect(
            isValidAmount("5000.5"),
        ).toBe(true);

    });


    it("accepts two decimal places", () => {

        expect(
            isValidAmount("5000.50"),
        ).toBe(true);

    });


    it("rejects zero", () => {

        expect(
            isValidAmount("0"),
        ).toBe(false);

    });


    it("rejects negative amounts", () => {

        expect(
            isValidAmount("-500"),
        ).toBe(false);

    });


    it("rejects more than two decimal places", () => {

        expect(
            isValidAmount("5000.123"),
        ).toBe(false);

    });


    it("rejects currency text", () => {

        expect(
            isValidAmount("Rs. 5000"),
        ).toBe(false);

    });


    it("rejects comma-formatted amounts", () => {

        expect(
            isValidAmount("5,000"),
        ).toBe(false);

    });


    it("rejects empty amount", () => {

        expect(
            isValidAmount(""),
        ).toBe(false);

    });


    it("rejects whitespace amount", () => {

        expect(
            isValidAmount("   "),
        ).toBe(false);

    });

});


/*
 * =========================================================
 * isValidCurrency
 * =========================================================
 */

describe("isValidCurrency", () => {

    it("accepts LKR", () => {

        expect(
            isValidCurrency("LKR"),
        ).toBe(true);

    });


    it("accepts USD", () => {

        expect(
            isValidCurrency("USD"),
        ).toBe(true);

    });


    it("accepts EUR", () => {

        expect(
            isValidCurrency("EUR"),
        ).toBe(true);

    });


    it("accepts lowercase currency codes", () => {

        expect(
            isValidCurrency("usd"),
        ).toBe(true);

    });


    it("rejects currency with two characters", () => {

        expect(
            isValidCurrency("US"),
        ).toBe(false);

    });


    it("rejects currency with four characters", () => {

        expect(
            isValidCurrency("USDD"),
        ).toBe(false);

    });


    it("rejects currency containing numbers", () => {

        expect(
            isValidCurrency("US1"),
        ).toBe(false);

    });


    it("rejects currency containing spaces", () => {

        expect(
            isValidCurrency("U SD"),
        ).toBe(false);

    });


    it("rejects empty currency", () => {

        expect(
            isValidCurrency(""),
        ).toBe(false);

    });

});


/*
 * =========================================================
 * validateBookingRow
 * =========================================================
 */

describe("validateBookingRow", () => {

    it("accepts a valid booking row", () => {

        const result =
            validateBookingRow(validRow);


        expect(result.valid)
            .toBe(true);


        expect(result.bookingDate)
            .toBe("2026-04-03");


        expect(result.amount)
            .toBe("5000.00");


        expect(result.currency)
            .toBe("LKR");


        expect(result.productCode)
            .toBe("TRAVEL");

    });


    it("accepts USD booking", () => {

        const result =
            validateBookingRow({
                ...validRow,
                amount: "100.00",
                currency: "USD",
            });


        expect(result.valid)
            .toBe(true);


        expect(result.amount)
            .toBe("100.00");


        expect(result.currency)
            .toBe("USD");

    });


    it("normalizes currency to uppercase", () => {

        const result =
            validateBookingRow({
                ...validRow,
                currency: "usd",
            });


        expect(result.valid)
            .toBe(true);


        expect(result.currency)
            .toBe("USD");

    });


    it("rejects missing booking reference", () => {

        const result =
            validateBookingRow({
                ...validRow,
                external_ref: "",
            });


        expect(result.valid)
            .toBe(false);


        expect(result.reason)
            .toBe("Ref is required.");

    });


    it("rejects missing agent code", () => {

        const result =
            validateBookingRow({
                ...validRow,
                agent_code: "",
            });


        expect(result.valid)
            .toBe(false);


        expect(result.reason)
            .toBe("Agent Code is required.");

    });


    it("rejects missing date", () => {

        const result =
            validateBookingRow({
                ...validRow,
                date: "",
            });


        expect(result.valid)
            .toBe(false);

    });


    it("rejects invalid date", () => {

        const result =
            validateBookingRow({
                ...validRow,
                date: "31/02/2026",
            });


        expect(result.valid)
            .toBe(false);

    });


    it("rejects missing amount", () => {

        const result =
            validateBookingRow({
                ...validRow,
                amount: "",
            });


        expect(result.valid)
            .toBe(false);


        expect(result.reason)
            .toBe("Amount is required.");

    });


    it("rejects invalid amount", () => {

        const result =
            validateBookingRow({
                ...validRow,
                amount: "abc",
            });


        expect(result.valid)
            .toBe(false);

    });


    it("rejects negative amount", () => {

        const result =
            validateBookingRow({
                ...validRow,
                amount: "-500",
            });


        expect(result.valid)
            .toBe(false);

    });


    it("rejects missing currency", () => {

        const result =
            validateBookingRow({
                ...validRow,
                currency: "",
            });


        expect(result.valid)
            .toBe(false);


        expect(result.reason)
            .toBe("Currency is required.");

    });


    it("rejects invalid currency", () => {

        const result =
            validateBookingRow({
                ...validRow,
                currency: "US",
            });


        expect(result.valid)
            .toBe(false);


        expect(result.reason)
            .toBe(
                "Currency must be a valid 3-letter currency code.",
            );

    });


    it("rejects currency containing numbers", () => {

        const result =
            validateBookingRow({
                ...validRow,
                currency: "US1",
            });


        expect(result.valid)
            .toBe(false);

    });


    it("accepts supported LKR currency", () => {

        const result =
            validateBookingRow({
                ...validRow,
                currency: "LKR",
            });


        expect(result.valid)
            .toBe(true);


        expect(result.currency)
            .toBe("LKR");

    });


    it("accepts supported USD currency", () => {

        const result =
            validateBookingRow({
                ...validRow,
                currency: "USD",
            });


        expect(result.valid)
            .toBe(true);


        expect(result.currency)
            .toBe("USD");

    });


    it("rejects unsupported product", () => {

        const result =
            validateBookingRow({
                ...validRow,
                product_code: "HOTEL",
            });


        expect(result.valid)
            .toBe(false);


        expect(result.reason)
            .toBe(
                "Product 'HOTEL' is not supported.",
            );

    });


    it("accepts supported VISA product", () => {

        const result =
            validateBookingRow({
                ...validRow,
                product_code: "VISA",
            });


        expect(result.valid)
            .toBe(true);


        expect(result.productCode)
            .toBe("VISA");

    });


    it("accepts supported INSURANCE product", () => {

        const result =
            validateBookingRow({
                ...validRow,
                product_code: "INSURANCE",
            });


        expect(result.valid)
            .toBe(true);


        expect(result.productCode)
            .toBe("INSURANCE");

    });


    it("normalizes product code to uppercase", () => {

        const result =
            validateBookingRow({
                ...validRow,
                product_code: "travel",
            });


        expect(result.valid)
            .toBe(true);


        expect(result.productCode)
            .toBe("TRAVEL");

    });


    it("trims booking reference", () => {

        const result =
            validateBookingRow({
                ...validRow,
                external_ref: "  BK-001  ",
            });


        expect(result.valid)
            .toBe(true);

    });


    it("trims agent code", () => {

        const result =
            validateBookingRow({
                ...validRow,
                agent_code: "  AG-001  ",
            });


        expect(result.valid)
            .toBe(true);

    });


    it("trims currency", () => {

        const result =
            validateBookingRow({
                ...validRow,
                currency: "  USD  ",
            });


        expect(result.valid)
            .toBe(true);


        expect(result.currency)
            .toBe("USD");

    });


    it("trims amount", () => {

        const result =
            validateBookingRow({
                ...validRow,
                amount: " 5000.00 ",
            });


        expect(result.valid)
            .toBe(true);


        expect(result.amount)
            .toBe("5000.00");

    });

});
