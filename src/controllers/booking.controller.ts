import type {
    Request,
    Response,
} from "express";

import { parse } from "csv-parse/sync";

import {
    importBookings,
} from "../services/booking.service";

import type {
    CsvBookingRow,
} from "../schemas/booking.schema";

interface CsvParsedRow {
    Ref?: string;
    "Agent Code"?: string;
    "Booking Date"?: string;
    Amount?: string;
    Product?: string;
    Notes?: string;

    [key: string]: string | undefined;
}

interface ImportRejection {
    row: number;
    reason: string;
}

export interface BookingImportRow {
    rowNumber: number;
    data: CsvBookingRow;
}

export async function importBookingsController(
    req: Request,
    res: Response,
): Promise<void> {

    /*
     * Authentication
     */

    if (!req.user) {
        res.status(401).json({
            error: {
                code: "UNAUTHORIZED",
                message: "Authentication required.",
            },
        });

        return;
    }

    /*
     * File validation
     */

    if (!req.file) {
        res.status(400).json({
            error: {
                code: "FILE_REQUIRED",
                message: "CSV file is required.",
            },
        });

        return;
    }

    try {

        /*
         * Convert uploaded file to text
         */

        const csvText =
            req.file.buffer.toString("utf-8");

        /*
         * Parse CSV
         *
         * relax_column_count allows extra columns.
         *
         * Example:
         *
         * Ref,Agent Code,Booking Date,Amount,Product,Notes
         *
         * and even:
         *
         * Ref,Agent Code,Booking Date,Amount,Product,Notes,Extra
         */

        const rows = parse(csvText, {
            columns: true,
            skip_empty_lines: true,
            trim: true,
            relax_column_count: true,
            relax_quotes: true,
            info: true,
        }) as Array<{
            record: CsvParsedRow;
            info: {
                lines: number;
            };
        }>;

        /*
         * Valid rows that will be sent
         * to the booking service.
         */

        const csvRows: BookingImportRow[] = [];

        /*
         * Errors detected directly by
         * the controller.
         */

        const rejections: ImportRejection[] = [];

        /*
         * Process every CSV row.
         */

        for (const item of rows) {

            const row =
                item.record;

            /*
             * csv-parse "lines" can move because of
             * quoted/multiline fields.
             *
             * For this CSV we use the actual record
             * position instead.
             *
             * Header = row 1
             * Data starts = row 2
             */

            const rowNumber =
                rows.indexOf(item) + 2;

            /*
             * Extract fields.
             */

            const externalRef =
                row.Ref?.trim() ?? "";

            const agentCode =
                row["Agent Code"]?.trim() ?? "";

            const date =
                row["Booking Date"]?.trim() ?? "";

            const amount =
                row.Amount?.trim() ?? "";

            const productCode =
                row.Product?.trim() ?? "";

            /*
             * Required field validation.
             */

            if (!externalRef) {

                rejections.push({
                    row: rowNumber,
                    reason: "Ref is required.",
                });

                continue;
            }

            if (!agentCode) {

                rejections.push({
                    row: rowNumber,
                    reason:
                        "Agent Code is required.",
                });

                continue;
            }

            if (!date) {

                rejections.push({
                    row: rowNumber,
                    reason:
                        "Booking Date is required.",
                });

                continue;
            }

            if (!amount) {

                rejections.push({
                    row: rowNumber,
                    reason:
                        "Amount is required.",
                });

                continue;
            }

            if (!productCode) {

                rejections.push({
                    row: rowNumber,
                    reason:
                        "Product is required.",
                });

                continue;
            }

            /*
             * Send valid controller-level rows
             * to the service together with their
             * ORIGINAL CSV row number.
             */

            csvRows.push({
                rowNumber,

                data: {
                    external_ref:
                        externalRef,

                    agent_code:
                        agentCode,

                    date,

                    amount,

                    product_code:
                        productCode,
                },
            });
        }

        /*
         * Import valid rows.
         */

        const summary =
            await importBookings(
                req.user.companyId,
                csvRows,
            );

        /*
         * Return result.
         */

        res.status(200).json({
            data: {
                summary: {
                    accepted:
                        summary.accepted,

                    rejected:
                        rejections.length +
                        summary.rejected,

                    duplicates:
                        summary.duplicates,

                    errors:
                        summary.errors,
                },

                rejections,
            },
        });

    } catch (error: unknown) {

        console.error(
            "Booking import error:",
            error,
        );

        res.status(500).json({
            error: {
                code:
                    "BOOKING_IMPORT_FAILED",

                message:
                    "Failed to import bookings.",
            },
        });
    }
}