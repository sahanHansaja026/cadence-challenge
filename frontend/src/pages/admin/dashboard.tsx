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

function Admin_dashboard() {
    const { user, isLoading } = useAuth();

    const { adminAuthorization } =
        useAuthorizationCheck();

    const [report, setReport] =
        useState<ReportSummary | null>(null);

    const [loading, setLoading] =
        useState(true);

    const [error, setError] =
        useState("");

    /*
     * Authorization + report loading
     */
    useEffect(() => {
        if (isLoading) {
            return;
        }

        adminAuthorization();
        fetchReport();

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

            {/* Sidebar */}
            <SidebarAdmin activeItem="Dashboard" />

            {/* Main Content */}
            <main className="flex-1 p-8">

                {/* Header */}
                <div className="mb-8">

                    <h1 className="text-3xl font-bold text-gray-900">
                        Dashboard
                    </h1>

                    <p className="mt-2 text-gray-500">
                        Welcome back, {user?.email}
                    </p>

                </div>


                {/* Company Information */}
                <div className="mb-8 rounded-xl border border-gray-200 bg-white p-6">

                    <h2 className="mb-5 text-lg font-semibold text-gray-900">
                        Company Information
                    </h2>

                    <div className="grid grid-cols-1 gap-5 md:grid-cols-3">

                        <div>
                            <p className="text-sm text-gray-500">
                                Email
                            </p>

                            <p className="mt-1 font-medium text-gray-900">
                                {user?.email}
                            </p>
                        </div>


                        <div>
                            <p className="text-sm text-gray-500">
                                Company
                            </p>

                            <p className="mt-1 font-medium text-gray-900">
                                {user?.companyId}
                            </p>
                        </div>


                        <div>
                            <p className="text-sm text-gray-500">
                                Role
                            </p>

                            <p className="mt-1 font-medium text-gray-900">
                                {user?.role}
                            </p>
                        </div>

                    </div>

                </div>


                {/* Report loading */}
                {loading && (
                    <div className="rounded-xl border border-gray-200 bg-white p-6">
                        Loading report...
                    </div>
                )}


                {/* Report error */}
                {!loading && error && (
                    <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-700">
                        {error}
                    </div>
                )}


                {/* Summary Cards */}
                {!loading && !error && report && (
                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">

                        {/* Total Users 
                        <div className="rounded-xl border border-gray-200 bg-white p-6">

                            <p className="text-sm text-gray-500">
                                Total Users
                            </p>

                            <p className="mt-2 text-3xl font-bold text-gray-900">
                                0
                            </p>

                        </div>
*/}

                        {/* Total Bookings */}
                        <div className="rounded-xl border border-gray-200 bg-white p-6">

                            <p className="text-sm text-gray-500">
                                Total Bookings
                            </p>

                            <p className="mt-2 text-3xl font-bold text-gray-900">
                                {Number(
                                    report.booking_count ?? 0,
                                )}
                            </p>

                        </div>


                        {/* Pending Payouts */}
                        <div className="rounded-xl border border-gray-200 bg-white p-6">

                            <p className="text-sm text-gray-500">
                                Payout Runs
                            </p>

                            <p className="mt-2 text-3xl font-bold text-gray-900">
                                {Number(
                                    report.payout_run_count ?? 0,
                                )}
                            </p>

                        </div>


                        {/* Commission Rules */}
                        <div className="rounded-xl border border-gray-200 bg-white p-6">

                            <p className="text-sm text-gray-500">
                                Commission Rules
                            </p>

                            <p className="mt-2 text-3xl font-bold text-gray-900">
                                0
                            </p>

                        </div>

                    </div>
                )}


                {/* Financial Summary */}
                {!loading && !error && report && (
                    <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2">

                        <div className="rounded-xl border border-gray-200 bg-white p-6">

                            <p className="text-sm text-gray-500">
                                Gross Volume
                            </p>

                            <p className="mt-2 text-2xl font-bold text-gray-900">
                                LKR {money(report.gross_volume)}
                            </p>

                        </div>


                        <div className="rounded-xl border border-gray-200 bg-white p-6">

                            <p className="text-sm text-gray-500">
                                Commission Amount
                            </p>

                            <p className="mt-2 text-2xl font-bold text-gray-900">
                                LKR {money(report.commission_amount)}
                            </p>

                        </div>

                    </div>
                )}

            </main>

        </div>
    );
}

export default Admin_dashboard;