import {
    describe,
    expect,
    it,
} from "vitest";

import {
    convertDate,
    isValidAmount,
    validateBookingRow,
} from "./booking-import.validator";


const validRow = {
    external_ref: "BK-001",
    agent_code: "AG-001",
    date: "03/04/2026",
    amount: "5000.00",
    product_code: "TRAVEL",
};


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

});


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

});


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

        expect(result.productCode)
            .toBe("TRAVEL");
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

});