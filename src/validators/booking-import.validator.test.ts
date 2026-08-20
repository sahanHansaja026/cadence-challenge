import {
    describe,
    expect,
    it,
} from "vitest";

import {
    convertDate,
    parseAmount,
    validateBookingRow,
} from "./booking-import.validator";


const validRow = {
    external_ref: "BK-001",
    agent_code: "AG-001",
    date: "03/04/2026",
    amount: "5000.00",
    product_code: "TRAVEL",
};


/*
 * ---------------------------------------------------------
 * DATE TESTS
 * ---------------------------------------------------------
 */
describe("convertDate", () => {

    it("converts DD/MM/YYYY", () => {
        expect(
            convertDate("03/04/2026"),
        ).toBe("2026-04-03");
    });


    it("accepts single digit day and month", () => {
        expect(
            convertDate("3/4/2026"),
        ).toBe("2026-04-03");
    });


    it("accepts 03/4/2026", () => {
        expect(
            convertDate("03/4/2026"),
        ).toBe("2026-04-03");
    });


    it("accepts 3/04/2026", () => {
        expect(
            convertDate("3/04/2026"),
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
            convertDate("32/03/2026"),
        ).toBeNull();
    });

});


/*
 * ---------------------------------------------------------
 * CURRENCY + AMOUNT TESTS
 * ---------------------------------------------------------
 */
describe("parseAmount", () => {

    /*
     * -----------------------------------------------------
     * LKR
     * -----------------------------------------------------
     */

    it("identifies plain number as LKR", () => {

        expect(
            parseAmount("5000"),
        ).toEqual({
            amount: "5000",
            currency: "LKR",
        });

    });


    it("identifies decimal number as LKR", () => {

        expect(
            parseAmount("5000.50"),
        ).toEqual({
            amount: "5000.50",
            currency: "LKR",
        });

    });


    it("identifies LKR prefix", () => {

        expect(
            parseAmount("LKR5000"),
        ).toEqual({
            amount: "5000",
            currency: "LKR",
        });

    });


    it("identifies LKR with space", () => {

        expect(
            parseAmount("LKR 5000"),
        ).toEqual({
            amount: "5000",
            currency: "LKR",
        });

    });


    it("identifies lowercase lkr", () => {

        expect(
            parseAmount("lkr5000"),
        ).toEqual({
            amount: "5000",
            currency: "LKR",
        });

    });


    it("identifies lowercase lkr with space", () => {

        expect(
            parseAmount("lkr 5000"),
        ).toEqual({
            amount: "5000",
            currency: "LKR",
        });

    });


    /*
     * -----------------------------------------------------
     * RS / RUPEE ALIASES
     * -----------------------------------------------------
     */

    it("identifies RS as LKR", () => {

        expect(
            parseAmount("RS5000"),
        ).toEqual({
            amount: "5000",
            currency: "LKR",
        });

    });


    it("identifies RS with space as LKR", () => {

        expect(
            parseAmount("RS 5000"),
        ).toEqual({
            amount: "5000",
            currency: "LKR",
        });

    });


    it("identifies lowercase rs as LKR", () => {

        expect(
            parseAmount("rs5000"),
        ).toEqual({
            amount: "5000",
            currency: "LKR",
        });

    });


    it("identifies Rs as LKR", () => {

        expect(
            parseAmount("Rs5000"),
        ).toEqual({
            amount: "5000",
            currency: "LKR",
        });

    });


    it("identifies Rs with space as LKR", () => {

        expect(
            parseAmount("Rs 5000"),
        ).toEqual({
            amount: "5000",
            currency: "LKR",
        });

    });


    it("identifies Rs. as LKR", () => {

        expect(
            parseAmount("Rs.5000"),
        ).toEqual({
            amount: "5000",
            currency: "LKR",
        });

    });


    it("identifies Rs. with space as LKR", () => {

        expect(
            parseAmount("Rs. 5000"),
        ).toEqual({
            amount: "5000",
            currency: "LKR",
        });

    });


    it("identifies uppercase RS. as LKR", () => {

        expect(
            parseAmount("RS.5000"),
        ).toEqual({
            amount: "5000",
            currency: "LKR",
        });

    });


    /*
     * -----------------------------------------------------
     * USD
     * -----------------------------------------------------
     */

    it("identifies USD", () => {

        expect(
            parseAmount("USD4300"),
        ).toEqual({
            amount: "4300",
            currency: "USD",
        });

    });


    it("identifies USD with space", () => {

        expect(
            parseAmount("USD 4300"),
        ).toEqual({
            amount: "4300",
            currency: "USD",
        });

    });


    it("identifies lowercase usd", () => {

        expect(
            parseAmount("usd4300"),
        ).toEqual({
            amount: "4300",
            currency: "USD",
        });

    });


    it("identifies lowercase usd with space", () => {

        expect(
            parseAmount("usd 4300"),
        ).toEqual({
            amount: "4300",
            currency: "USD",
        });

    });


    it("identifies USD decimal amount", () => {

        expect(
            parseAmount("USD4300.40"),
        ).toEqual({
            amount: "4300.40",
            currency: "USD",
        });

    });


    /*
     * -----------------------------------------------------
     * WHITESPACE
     * -----------------------------------------------------
     */

    it("accepts leading and trailing spaces", () => {

        expect(
            parseAmount("  USD 4300  "),
        ).toEqual({
            amount: "4300",
            currency: "USD",
        });

    });


    /*
     * -----------------------------------------------------
     * INVALID AMOUNTS
     * -----------------------------------------------------
     */

    it("rejects zero", () => {

        expect(
            parseAmount("0"),
        ).toBeNull();

    });


    it("rejects negative amount", () => {

        expect(
            parseAmount("-500"),
        ).toBeNull();

    });


    it("rejects more than two decimal places", () => {

        expect(
            parseAmount("5000.123"),
        ).toBeNull();

    });


    it("rejects comma formatted amount", () => {

        expect(
            parseAmount("5,000"),
        ).toBeNull();

    });


    /*
     * -----------------------------------------------------
     * UNSUPPORTED CURRENCIES
     * -----------------------------------------------------
     */

    it("rejects EUR", () => {

        expect(
            parseAmount("EUR5000"),
        ).toBeNull();

    });


    it("rejects GBP", () => {

        expect(
            parseAmount("GBP5000"),
        ).toBeNull();

    });


    it("rejects JPY", () => {

        expect(
            parseAmount("JPY5000"),
        ).toBeNull();

    });


    it("rejects Dollars", () => {

        expect(
            parseAmount("Dollars5000"),
        ).toBeNull();

    });


    it("rejects Rupees word", () => {

        expect(
            parseAmount("Rupees5000"),
        ).toBeNull();

    });


    it("rejects currency without amount", () => {

        expect(
            parseAmount("USD"),
        ).toBeNull();

    });

});


/*
 * ---------------------------------------------------------
 * BOOKING VALIDATION
 * ---------------------------------------------------------
 */
describe("validateBookingRow", () => {

    it("accepts a valid booking", () => {

        const result =
            validateBookingRow(validRow);

        expect(result.valid)
            .toBe(true);

        expect(result.bookingDate)
            .toBe("2026-04-03");

        expect(result.amount)
            .toBe("5000.00");

        expect(result.originalAmount)
            .toBe("5000.00");

        expect(result.currency)
            .toBe("LKR");

        expect(result.productCode)
            .toBe("TRAVEL");

    });


    /*
     * -----------------------------------------------------
     * USD BOOKING
     * -----------------------------------------------------
     */

    it("identifies USD booking", () => {

        const result =
            validateBookingRow({
                ...validRow,
                amount: "USD4300.40",
            });

        expect(result.valid)
            .toBe(true);

        expect(result.currency)
            .toBe("USD");

        expect(result.originalAmount)
            .toBe("4300.40");

        expect(result.amount)
            .toBe("4300.40");

    });


    it("identifies lowercase usd booking", () => {

        const result =
            validateBookingRow({
                ...validRow,
                amount: "usd4300.40",
            });

        expect(result.valid)
            .toBe(true);

        expect(result.currency)
            .toBe("USD");

        expect(result.originalAmount)
            .toBe("4300.40");

    });


    /*
     * -----------------------------------------------------
     * LKR BOOKING
     * -----------------------------------------------------
     */

    it("identifies LKR booking", () => {

        const result =
            validateBookingRow({
                ...validRow,
                amount: "LKR5000",
            });

        expect(result.valid)
            .toBe(true);

        expect(result.currency)
            .toBe("LKR");

        expect(result.originalAmount)
            .toBe("5000");

    });


    it("identifies lowercase lkr booking", () => {

        const result =
            validateBookingRow({
                ...validRow,
                amount: "lkr5000",
            });

        expect(result.valid)
            .toBe(true);

        expect(result.currency)
            .toBe("LKR");

        expect(result.originalAmount)
            .toBe("5000");

    });


    /*
     * -----------------------------------------------------
     * RS BOOKING
     * -----------------------------------------------------
     */

    it("identifies RS as LKR", () => {

        const result =
            validateBookingRow({
                ...validRow,
                amount: "RS 5000",
            });

        expect(result.valid)
            .toBe(true);

        expect(result.currency)
            .toBe("LKR");

        expect(result.originalAmount)
            .toBe("5000");

    });


    it("identifies Rs as LKR", () => {

        const result =
            validateBookingRow({
                ...validRow,
                amount: "Rs 5000",
            });

        expect(result.valid)
            .toBe(true);

        expect(result.currency)
            .toBe("LKR");

    });


    it("identifies Rs. as LKR", () => {

        const result =
            validateBookingRow({
                ...validRow,
                amount: "Rs. 5000",
            });

        expect(result.valid)
            .toBe(true);

        expect(result.currency)
            .toBe("LKR");

        expect(result.originalAmount)
            .toBe("5000");

    });


    /*
     * -----------------------------------------------------
     * NO CURRENCY
     * -----------------------------------------------------
     */

    it("defaults amount without currency to LKR", () => {

        const result =
            validateBookingRow({
                ...validRow,
                amount: "22000",
            });

        expect(result.valid)
            .toBe(true);

        expect(result.currency)
            .toBe("LKR");

        expect(result.originalAmount)
            .toBe("22000");

    });


    it("defaults decimal amount without currency to LKR", () => {

        const result =
            validateBookingRow({
                ...validRow,
                amount: "18750.65",
            });

        expect(result.valid)
            .toBe(true);

        expect(result.currency)
            .toBe("LKR");

    });


    /*
     * -----------------------------------------------------
     * INVALID CURRENCY
     * -----------------------------------------------------
     */

    it("rejects unsupported currency", () => {

        const result =
            validateBookingRow({
                ...validRow,
                amount: "EUR5000",
            });

        expect(result.valid)
            .toBe(false);

        expect(result.reason)
            .toContain("Amount must be");

    });


    /*
     * -----------------------------------------------------
     * REQUIRED FIELDS
     * -----------------------------------------------------
     */

    it("rejects missing reference", () => {

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


    it("rejects missing agent", () => {

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


    it("rejects zero amount", () => {

        const result =
            validateBookingRow({
                ...validRow,
                amount: "0",
            });

        expect(result.valid)
            .toBe(false);

    });


    it("rejects negative amount", () => {

        const result =
            validateBookingRow({
                ...validRow,
                amount: "-1250",
            });

        expect(result.valid)
            .toBe(false);

    });


    it("rejects more than two decimal places", () => {

        const result =
            validateBookingRow({
                ...validRow,
                amount: "7425.955",
            });

        expect(result.valid)
            .toBe(false);

    });


    /*
     * -----------------------------------------------------
     * PRODUCTS
     * -----------------------------------------------------
     */

    it("accepts VISA", () => {

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


    it("accepts lowercase product", () => {

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


    it("accepts INSURANCE", () => {

        const result =
            validateBookingRow({
                ...validRow,
                product_code: "INSURANCE",
            });

        expect(result.valid)
            .toBe(true);

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


    it("rejects missing product", () => {

        const result =
            validateBookingRow({
                ...validRow,
                product_code: "",
            });

        expect(result.valid)
            .toBe(false);

        expect(result.reason)
            .toBe("Product is required.");

    });

});