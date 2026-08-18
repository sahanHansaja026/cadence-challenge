import { useEffect, useState } from "react";

import { useAuth } from "../../context/AuthContext";
import {
    useAuthorizationCheck,
} from "../../authorization/AuthorizationCheck";

import SidebarAdmin from "../../component/layout/sidebar-admin";
import api from "../../services/api";


interface ReportSummary {
    booking_count: number;
    gross_volume: string | number;
    commission_amount: string | number;
    payout_run_count: number;
}


function Reports() {

    const {
        isLoading,
    } = useAuth();

    const {
        adminAuthorization,
    } = useAuthorizationCheck();


    const [report, setReport] =
        useState<ReportSummary | null>(null);

    const [loading, setLoading] =
        useState(true);

    const [error, setError] =
        useState("");


    useEffect(() => {

        if (!isLoading) {
            adminAuthorization();
            fetchReport();
        }

    }, [isLoading]);


    async function fetchReport() {

        try {

            setLoading(true);
            setError("");

            const response =
                await api.get(
                    "/reports/summary",
                );


            console.log(
                "REPORT RESPONSE:",
                response.data,
            );


            /*
             * Backend response:
             *
             * {
             *   data: {
             *      summary: {...}
             *   }
             * }
             */

            const summary =
                response.data?.data?.summary;


            if (!summary) {

                throw new Error(
                    "Report summary was not returned by the server.",
                );
            }


            setReport(summary);


        } catch (err: any) {

            console.error(
                "Report error:",
                err,
            );


            setError(
                err?.response?.data?.error?.message ||
                err?.message ||
                "Failed to load report.",
            );

        } finally {

            setLoading(false);

        }
    }


    function money(
        value: string | number | undefined,
    ): string {

        const amount =
            Number(value ?? 0);


        if (!Number.isFinite(amount)) {
            return "0.00";
        }


        return amount.toLocaleString(
            "en-LK",
            {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
            },
        );
    }


    if (isLoading) {

        return (
            <div className="flex min-h-screen items-center justify-center">
                Loading...
            </div>
        );

    }


    return (
        <div className="flex min-h-screen bg-gray-50">

            <SidebarAdmin
                activeItem="Reports"
            />


            <main className="flex-1 p-8">

                {/* Header */}

                <div className="mb-8">

                    <h1 className="text-3xl font-bold text-gray-900">
                        Reports
                    </h1>

                    <p className="mt-2 text-gray-500">
                        View your company's payout and booking summary.
                    </p>

                </div>


                {/* Loading */}

                {loading && (

                    <div className="rounded-xl bg-white p-8 shadow-sm">

                        <p className="text-gray-500">
                            Loading report...
                        </p>

                    </div>

                )}


                {/* Error */}

                {!loading && error && (

                    <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-red-700">

                        {error}

                    </div>

                )}


                {/* Report */}

                {!loading &&
                    !error &&
                    report && (

                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">


                            {/* Total Bookings */}

                            <div className="rounded-xl bg-white p-6 shadow-sm">

                                <p className="text-sm font-medium text-gray-500">
                                    Total Bookings
                                </p>

                                <p className="mt-3 text-3xl font-bold text-gray-900">

                                    {Number(
                                        report.booking_count ?? 0,
                                    )}

                                </p>

                            </div>


                            {/* Booking Volume */}

                            <div className="rounded-xl bg-white p-6 shadow-sm">

                                <p className="text-sm font-medium text-gray-500">
                                    Booking Volume
                                </p>

                                <p className="mt-3 text-3xl font-bold text-gray-900">

                                    LKR{" "}

                                    {money(
                                        report.gross_volume,
                                    )}

                                </p>

                            </div>


                            {/* Total Commission */}

                            <div className="rounded-xl bg-white p-6 shadow-sm">

                                <p className="text-sm font-medium text-gray-500">
                                    Total Commission
                                </p>

                                <p className="mt-3 text-3xl font-bold text-gray-900">

                                    LKR{" "}

                                    {money(
                                        report.commission_amount,
                                    )}

                                </p>

                            </div>


                            {/* Total Payouts */}

                            <div className="rounded-xl bg-white p-6 shadow-sm">

                                <p className="text-sm font-medium text-gray-500">
                                    Payout Runs
                                </p>

                                <p className="mt-3 text-3xl font-bold text-gray-900">

                                    {Number(
                                        report.payout_run_count ?? 0,
                                    )}

                                </p>

                            </div>

                        </div>

                    )}

            </main>

        </div>
    );
}


export default Reports;