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

    /*
     * Original currency supplied by CSV.
     *
     * If no currency is supplied,
     * this will be LKR.
     */
    currency?: "LKR" | "USD";

    /*
     * Original numeric amount before
     * currency conversion.
     */
    originalAmount?: string;

    /*
     * Amount that will be stored in DB.
     *
     * USD is converted to LKR before
     * reaching the database.
     */
    amount?: string;

    productCode?: string;
}


/*
 * ---------------------------------------------------------
 * DATE
 * ---------------------------------------------------------
 *
 * Supports:
 *
 * 03/04/2026
 * 3/4/2026
 * 3/04/2026
 * 03/4/2026
 *
 * Converts to:
 *
 * 2026-04-03
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

    const day =
        Number(match[1]);

    const month =
        Number(match[2]);

    const year =
        Number(match[3]);


    if (
        month < 1 ||
        month > 12 ||
        day < 1 ||
        day > 31
    ) {
        return null;
    }


    const date =
        new Date(
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

        String(month)
            .padStart(2, "0"),

        String(day)
            .padStart(2, "0"),
    ].join("-");
}


/*
 * ---------------------------------------------------------
 * AMOUNT + CURRENCY PARSER
 * ---------------------------------------------------------
 *
 * Accepted:
 *
 * 5000
 * 5000.50
 *
 * USD5000
 * USD 5000
 * USD5000.50
 * USD 5000.50
 *
 * LKR5000
 * LKR 5000
 *
 * RS5000
 * RS 5000
 * Rs5000
 * Rs 5000
 * Rs.5000
 * Rs. 5000
 *
 *
 * If currency is missing:
 *
 * 5000
 *
 * it is treated as LKR.
 *
 *
 * Rejected:
 *
 * EUR500
 * GBP500
 * JPY500
 * Dollars500
 * 5,000
 * -500
 * 0
 * 5000.123
 */
export function parseAmount(
    value: string,
): ParsedAmount | null {

    const amount =
        value.trim();

    if (!amount) {
        return null;
    }


    /*
     * -----------------------------------------------------
     * USD
     * -----------------------------------------------------
     *
     * USD4300
     * USD 4300
     * usd4300
     * usd 4300
     */
    let match =
        /^USD\s*(\d+(?:\.\d{1,2})?)$/i.exec(
            amount,
        );

    if (match) {

        const numericAmount =
            match[1];

        if (numericAmount === undefined) {
            return null;
        }

        if (Number(numericAmount) <= 0) {
            return null;
        }

        return {
            amount: numericAmount,
            currency: "USD",
        };
    }


    /*
     * -----------------------------------------------------
     * LKR
     * -----------------------------------------------------
     *
     * LKR5000
     * LKR 5000
     * lkr5000
     * lkr 5000
     */
    match =
        /^LKR\s*(\d+(?:\.\d{1,2})?)$/i.exec(
            amount,
        );

    if (match) {

        const numericAmount =
            match[1];

        if (numericAmount === undefined) {
            return null;
        }

        if (Number(numericAmount) <= 0) {
            return null;
        }

        return {
            amount: numericAmount,
            currency: "LKR",
        };
    }


    /*
     * -----------------------------------------------------
     * RS / RUPEE ALIASES
     * -----------------------------------------------------
     *
     * RS5000
     * RS 5000
     * Rs5000
     * Rs 5000
     * Rs.5000
     * Rs. 5000
     */
    match =
        /^(?:RS|RS\.)\s*(\d+(?:\.\d{1,2})?)$/i.exec(
            amount,
        );

    if (match) {

        const numericAmount =
            match[1];

        if (numericAmount === undefined) {
            return null;
        }

        if (Number(numericAmount) <= 0) {
            return null;
        }

        return {
            amount: numericAmount,
            currency: "LKR",
        };
    }


    /*
     * -----------------------------------------------------
     * NO CURRENCY
     * -----------------------------------------------------
     *
     * 5000
     * 5000.50
     *
     * Default = LKR
     */
    match =
        /^(\d+(?:\.\d{1,2})?)$/.exec(
            amount,
        );

    if (match) {

        const numericAmount =
            match[1];

        if (numericAmount === undefined) {
            return null;
        }

        if (Number(numericAmount) <= 0) {
            return null;
        }

        return {
            amount: numericAmount,
            currency: "LKR",
        };
    }


    /*
     * Unsupported currency or invalid amount.
     *
     * Examples:
     *
     * EUR500
     * GBP500
     * JPY500
     * Dollars500
     * 5,000
     * -500
     * 5000.123
     */
    return null;
}


/*
 * ---------------------------------------------------------
 * PRODUCTS
 * ---------------------------------------------------------
 */
const allowedProducts =
    new Set([
        "TRAVEL",
        "VISA",
        "INSURANCE",
    ]);


/*
 * ---------------------------------------------------------
 * VALIDATE BOOKING ROW
 * ---------------------------------------------------------
 *
 * This function performs ONLY pure validation.
 *
 * It does NOT access PostgreSQL.
 *
 * Currency conversion is performed by
 * importBookings(), because it requires
 * exchange_rates from the database.
 */
export function validateBookingRow(
    row: BookingCsvRow,
): BookingValidationResult {

    const externalRef =
        row.external_ref
            ?.trim() ?? "";


    const agentCode =
        row.agent_code
            ?.trim() ?? "";


    const date =
        row.date
            ?.trim() ?? "";


    const amountValue =
        row.amount
            ?.trim() ?? "";


    const productCode =
        row.product_code
            ?.trim()
            .toUpperCase() ?? "";


    /*
     * -----------------------------------------------------
     * REF
     * -----------------------------------------------------
     */
    if (!externalRef) {

        return {
            valid: false,
            reason:
                "Ref is required.",
        };
    }


    /*
     * -----------------------------------------------------
     * AGENT
     * -----------------------------------------------------
     */
    if (!agentCode) {

        return {
            valid: false,
            reason:
                "Agent Code is required.",
        };
    }


    /*
     * -----------------------------------------------------
     * DATE
     * -----------------------------------------------------
     */
    if (!date) {

        return {
            valid: false,
            reason:
                "Booking Date is required.",
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


    /*
     * -----------------------------------------------------
     * AMOUNT + CURRENCY
     * -----------------------------------------------------
     */
    if (!amountValue) {

        return {
            valid: false,
            reason:
                "Amount is required.",
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


    /*
     * -----------------------------------------------------
     * PRODUCT
     * -----------------------------------------------------
     */
    if (!productCode) {

        return {
            valid: false,
            reason:
                "Product is required.",
        };
    }


    if (
        !allowedProducts.has(
            productCode,
        )
    ) {

        return {
            valid: false,
            reason:
                `Product '${productCode}' is not supported.`,
        };
    }


    /*
     * -----------------------------------------------------
     * SUCCESS
     * -----------------------------------------------------
     */
    return {
        valid: true,

        bookingDate,

        currency:
            parsedAmount.currency,

        originalAmount:
            parsedAmount.amount,

        /*
         * At this point the amount is still
         * the original amount.
         *
         * importBookings() will convert USD
         * to LKR using exchange_rates.
         */
        amount:
            parsedAmount.amount,

        productCode,
    };
}