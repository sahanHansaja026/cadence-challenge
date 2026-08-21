import type {
    Request,
    Response,
} from "express";

import { parse } from "csv-parse/sync";

import {
    importBookings,
} from "../services/booking.service";
import { CsvBookingRow } from "../schemas/booking.schema";




interface CsvParsedRow {

    Ref?: string;

    "Agent Code"?: string;

    "Booking Date"?: string;

    Amount?: string;

    Product?: string;

    Notes?: string;

    [key: string]:
    | string
    | undefined;
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
     * -----------------------------------------------------
     * AUTHENTICATION
     * -----------------------------------------------------
     */
    if (!req.user) {

        res.status(401).json({
            error: {
                code: "UNAUTHORIZED",
                message:
                    "Authentication required.",
            },
        });

        return;
    }


    /*
     * -----------------------------------------------------
     * FILE
     * -----------------------------------------------------
     */
    if (!req.file) {

        res.status(400).json({
            error: {
                code: "FILE_REQUIRED",
                message:
                    "CSV file is required.",
            },
        });

        return;
    }


    try {

        /*
         * -------------------------------------------------
         * READ CSV
         * -------------------------------------------------
         */
        const csvText =
            req.file.buffer.toString(
                "utf-8",
            );


        /*
         * -------------------------------------------------
         * PARSE CSV
         * -------------------------------------------------
         */
        const rows =
            parse(csvText, {

                columns: true,

                skip_empty_lines: true,

                trim: true,

                relax_column_count: true,

                relax_quotes: true,

            }) as CsvParsedRow[];


        const csvRows:
            BookingImportRow[] = [];


        const rejections:
            ImportRejection[] = [];


        /*
         * -------------------------------------------------
         * PROCESS CSV ROWS
         * -------------------------------------------------
         */
        for (
            let index = 0;
            index < rows.length;
            index++
        ) {

            const row =
                rows[index];


            /*
             * Header = row 1
             * First data row = row 2
             */
            const rowNumber =
                index + 2;


            const externalRef =
                row?.Ref?.trim() ?? "";


            const agentCode =
                row?.["Agent Code"]
                    ?.trim() ?? "";


            const date =
                row?.["Booking Date"]
                    ?.trim() ?? "";


            const amount =
                row?.Amount?.trim() ?? "";


            const productCode =
                row?.Product?.trim() ?? "";


            /*
             * Required fields.
             */
            if (!externalRef) {

                rejections.push({
                    row: rowNumber,
                    reason:
                        "Ref is required.",
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
             * Send row to booking service.
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
         * -------------------------------------------------
         * IMPORT
         * -------------------------------------------------
         */
        const summary =
            await importBookings(
                req.user.companyId,
                csvRows,
            );


        /*
         * -------------------------------------------------
         * RESPONSE
         * -------------------------------------------------
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