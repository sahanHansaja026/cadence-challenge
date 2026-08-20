export interface BookingCsvRow {
    external_ref?: string;
    agent_code?: string;
    date?: string;
    amount?: string;
    product_code?: string;
}

export interface ParsedAmount {
    amount: string;
    currency: "LKR" | "USD";
}

export interface BookingValidationResult {
    valid: boolean;
    reason?: string;

    bookingDate?: string;

    currency?: "LKR" | "USD";

    originalAmount?: string;

    amount?: string;

    productCode?: string;
}

/*
 * ---------------------------------------------------------
 * DATE
 * ---------------------------------------------------------
 */

export function convertDate(
    value: string,
): string | null {

    const match =
        /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(
            value.trim(),
        );

    if (!match) {
        return null;
    }

    const day = Number(match[1]);
    const month = Number(match[2]);
    const year = Number(match[3]);

    if (
        month < 1 ||
        month > 12 ||
        day < 1 ||
        day > 31
    ) {
        return null;
    }

    const date = new Date(
        Date.UTC(
            year,
            month - 1,
            day,
        ),
    );

    if (
        date.getUTCFullYear() !== year ||
        date.getUTCMonth() !== month - 1 ||
        date.getUTCDate() !== day
    ) {
        return null;
    }

    return [
        String(year),
        String(month).padStart(2, "0"),
        String(day).padStart(2, "0"),
    ].join("-");
}

/*
 * ---------------------------------------------------------
 * AMOUNT
 * ---------------------------------------------------------
 */

export function parseAmount(
    value: string,
): ParsedAmount | null {

    const amount = value.trim();

    if (!amount) {
        return null;
    }

    let match =
        /^USD\s*(\d+(?:\.\d{1,2})?)$/i.exec(
            amount,
        );

    if (match) {

        const numericAmount = match[1];

        if (
            numericAmount === undefined ||
            Number(numericAmount) <= 0
        ) {
            return null;
        }

        return {
            amount: numericAmount,
            currency: "USD",
        };
    }

    match =
        /^LKR\s*(\d+(?:\.\d{1,2})?)$/i.exec(
            amount,
        );

    if (match) {

        const numericAmount = match[1];

        if (
            numericAmount === undefined ||
            Number(numericAmount) <= 0
        ) {
            return null;
        }

        return {
            amount: numericAmount,
            currency: "LKR",
        };
    }

    match =
        /^(?:RS|RS\.)\s*(\d+(?:\.\d{1,2})?)$/i.exec(
            amount,
        );

    if (match) {

        const numericAmount = match[1];

        if (
            numericAmount === undefined ||
            Number(numericAmount) <= 0
        ) {
            return null;
        }

        return {
            amount: numericAmount,
            currency: "LKR",
        };
    }

    match =
        /^(\d+(?:\.\d{1,2})?)$/.exec(
            amount,
        );

    if (match) {

        const numericAmount = match[1];

        if (
            numericAmount === undefined ||
            Number(numericAmount) <= 0
        ) {
            return null;
        }

        return {
            amount: numericAmount,
            currency: "LKR",
        };
    }

    return null;
}

/*
 * ---------------------------------------------------------
 * PRODUCTS
 * ---------------------------------------------------------
 */

const allowedProducts = new Set([
    "TRAVEL",
    "VISA",
    "INSURANCE",
]);

/*
 * ---------------------------------------------------------
 * VALIDATE BOOKING
 * ---------------------------------------------------------
 */

export function validateBookingRow(
    row: BookingCsvRow,
): BookingValidationResult {

    const externalRef =
        row.external_ref?.trim() ?? "";

    const agentCode =
        row.agent_code?.trim() ?? "";

    const date =
        row.date?.trim() ?? "";

    const amountValue =
        row.amount?.trim() ?? "";

    const productCode =
        row.product_code
            ?.trim()
            .toUpperCase() ?? "";

    if (!externalRef) {
        return {
            valid: false,
            reason: "Ref is required.",
        };
    }

    if (!agentCode) {
        return {
            valid: false,
            reason: "Agent Code is required.",
        };
    }

    if (!date) {
        return {
            valid: false,
            reason: "Booking Date is required.",
        };
    }

    const bookingDate =
        convertDate(date);

    if (!bookingDate) {
        return {
            valid: false,
            reason:
                "Date must be a valid date in DD/MM/YYYY format.",
        };
    }

    if (!amountValue) {
        return {
            valid: false,
            reason: "Amount is required.",
        };
    }

    const parsedAmount =
        parseAmount(amountValue);

    if (!parsedAmount) {
        return {
            valid: false,
            reason:
                "Amount must be a positive number with maximum 2 decimal places and use LKR, USD, or Rs currency.",
        };
    }

    if (!productCode) {
        return {
            valid: false,
            reason: "Product is required.",
        };
    }

    if (!allowedProducts.has(productCode)) {
        return {
            valid: false,
            reason:
                `Product '${productCode}' is not supported.`,
        };
    }

    return {
        valid: true,

        bookingDate,

        currency:
            parsedAmount.currency,

        originalAmount:
            parsedAmount.amount,

        /*
         * This is still the original amount.
         * Conversion happens in booking.service.ts.
         */
        amount:
            parsedAmount.amount,

        productCode,
    };
}