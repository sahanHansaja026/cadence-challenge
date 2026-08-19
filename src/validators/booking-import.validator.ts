export interface BookingCsvRow {
    external_ref?: string;
    agent_code?: string;
    date?: string;
    amount?: string;
    currency?: string;
    product_code?: string;
}


export interface BookingValidationResult {
    valid: boolean;
    reason?: string;
    bookingDate?: string;
    amount?: string;
    currency?: string;
    productCode?: string;
}


/*
 * Convert DD/MM/YYYY or D/M/YYYY
 * into PostgreSQL YYYY-MM-DD.
 *
 * Example:
 *
 * 03/04/2026
 *
 * means:
 *
 * 3 April 2026
 *
 * and becomes:
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


    /*
     * Basic range validation.
     */
    if (
        month < 1 ||
        month > 12 ||
        day < 1 ||
        day > 31
    ) {
        return null;
    }


    /*
     * JavaScript Date validation.
     *
     * This catches invalid dates such as:
     *
     * 31/02/2026
     * 31/04/2026
     */
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
 * Validate booking amount.
 *
 * Valid:
 *
 * 5000
 * 5000.5
 * 5000.50
 *
 * Invalid:
 *
 * -500
 * 0
 * 5000.123
 * Rs. 5000
 * USD 500
 * 5,000
 */
export function isValidAmount(
    value: string,
): boolean {

    const amount =
        value.trim();


    if (
        !/^\d+(\.\d{1,2})?$/.test(
            amount,
        )
    ) {
        return false;
    }


    return Number(amount) > 0;
}


/*
 * Validate currency.
 *
 * Currency must be a three-letter
 * ISO-style currency code.
 *
 * Examples:
 *
 * LKR
 * USD
 * EUR
 */
export function isValidCurrency(
    value: string,
): boolean {

    const currency =
        value.trim().toUpperCase();


    return /^[A-Z]{3}$/.test(
        currency,
    );
}


/*
 * Products currently supported
 * by Cadence.
 */
const allowedProducts =
    new Set([
        "TRAVEL",
        "VISA",
        "INSURANCE",
    ]);


/*
 * Validate one CSV booking row.
 *
 * This function does NOT access PostgreSQL.
 *
 * Database checks such as:
 *
 * - agent exists
 * - agent belongs to company
 * - duplicate booking
 * - exchange rate exists
 *
 * remain inside importBookings().
 *
 * Exchange-rate conversion also happens
 * inside importBookings().
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


    const amount =
        row.amount
            ?.trim() ?? "";


    const currency =
        row.currency
            ?.trim()
            .toUpperCase() ?? "";


    const productCode =
        row.product_code
            ?.trim()
            .toUpperCase() ?? "";


    /*
     * Validate booking reference.
     */
    if (!externalRef) {

        return {
            valid: false,
            reason:
                "Ref is required.",
        };
    }


    /*
     * Validate agent code.
     */
    if (!agentCode) {

        return {
            valid: false,
            reason:
                "Agent Code is required.",
        };
    }


    /*
     * Validate date.
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
     * Validate amount.
     */
    if (!amount) {

        return {
            valid: false,
            reason:
                "Amount is required.",
        };
    }


    if (!isValidAmount(amount)) {

        return {
            valid: false,
            reason:
                "Amount must be a positive number with maximum 2 decimal places.",
        };
    }


    /*
     * Validate currency.
     */
    if (!currency) {

        return {
            valid: false,
            reason:
                "Currency is required.",
        };
    }


    if (!isValidCurrency(currency)) {

        return {
            valid: false,
            reason:
                "Currency must be a valid 3-letter currency code.",
        };
    }


    /*
     * Validate product.
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
     * All CSV validation passed.
     *
     * Example:
     *
     * amount = 100
     * currency = USD
     *
     * The validator only returns the
     * original values.
     *
     * The import service will later:
     *
     * 1. Find the exchange rate.
     * 2. Convert USD -> LKR.
     * 3. Store original amount.
     * 4. Store currency.
     * 5. Store exchange rate.
     * 6. Store LKR amount.
     */
    return {
        valid: true,

        bookingDate,

        amount,

        currency,

        productCode,
    };
}

