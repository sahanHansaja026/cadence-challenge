import {
    useEffect,
    useState,
} from "react";

import {
    useAuth,
} from "../../context/AuthContext";

import {
    useAuthorizationCheck,
} from "../../authorization/AuthorizationCheck";

import SidebarAdmin from "../../component/layout/sidebar-admin";

import api from "../../services/api";


/*
 * =========================================================
 * TYPES
 * =========================================================
 */

interface AdminReportSummary {

    total_users: number;

    total_agents: number;

    total_finance_users: number;

    total_commission_rules: number;

    active_commission_rules: number;

    total_bookings: number;

    gross_volume: string | number;

    total_commission: string | number;

}


/*
 * =========================================================
 * COMPONENT
 * =========================================================
 */

function Reports() {

    const {
        isLoading,
    } = useAuth();


    const {
        financeAuthorization,
    } = useAuthorizationCheck();


    const [
        report,
        setReport,
    ] = useState<AdminReportSummary | null>(null);


    const [
        loading,
        setLoading,
    ] = useState(true);


    const [
        error,
        setError,
    ] = useState("");


    /*
     * =========================================================
     * AUTHORIZATION + LOAD
     * =========================================================
     */

    useEffect(() => {

        if (!isLoading) {

            financeAuthorization();

            fetchReport();

        }

    }, [isLoading]);


    /*
     * =========================================================
     * FETCH ADMIN REPORT
     * =========================================================
     */

    async function fetchReport() {

        try {

            setLoading(true);

            setError("");


            const response =
                await api.get(
                    "/reports/summary",
                );


            console.log(
                "ADMIN REPORT RESPONSE:",
                response.data,
            );


            const summary =
                response.data?.data?.summary;


            if (!summary) {

                throw new Error(
                    "Admin report summary was not returned by the server.",
                );

            }


            setReport({

                total_users:
                    Number(
                        summary.total_users ?? 0,
                    ),

                total_agents:
                    Number(
                        summary.total_agents ?? 0,
                    ),

                total_finance_users:
                    Number(
                        summary.total_finance_users ?? 0,
                    ),

                total_commission_rules:
                    Number(
                        summary.total_commission_rules ?? 0,
                    ),

                active_commission_rules:
                    Number(
                        summary.active_commission_rules ?? 0,
                    ),

                total_bookings:
                    Number(
                        summary.total_bookings ?? 0,
                    ),

                gross_volume:
                    summary.gross_volume ?? "0.00",

                total_commission:
                    summary.total_commission ?? "0.00",

            });


        } catch (err: any) {

            console.error(
                "Admin report error:",
                err,
            );


            setError(
                err?.response?.data?.error?.message ||
                err?.message ||
                "Failed to load admin report.",
            );


        } finally {

            setLoading(false);

        }

    }


    /*
     * =========================================================
     * MONEY FORMAT
     * =========================================================
     */

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


    /*
     * =========================================================
     * NUMBER FORMAT
     * =========================================================
     */

    function number(
        value: number | undefined,
    ): string {

        return Number(
            value ?? 0,
        ).toLocaleString(
            "en-LK",
        );

    }


    /*
     * =========================================================
     * AUTH LOADING
     * =========================================================
     */

    if (isLoading) {

        return (

            <div className="flex min-h-screen items-center justify-center">

                Loading...

            </div>

        );

    }


    /*
     * =========================================================
     * PAGE
     * =========================================================
     */

    return (

        <div className="flex min-h-screen bg-gray-50">

            {/* =================================================
                SIDEBAR
            ================================================= */}

            <SidebarAdmin
                activeItem="Reports & Statements"
            />


            {/* =================================================
                MAIN
            ================================================= */}

            <main className="flex-1 p-8">


                {/* =================================================
                    HEADER
                ================================================= */}

                <div className="mb-8 flex items-start justify-between">

                    <div>

                        <h1 className="text-3xl font-bold text-gray-900">

                            Reports & Statements

                        </h1>


                        <p className="mt-2 text-gray-500">

                            Company overview of users,
                            commission rules, bookings,
                            and financial activity.

                        </p>

                    </div>


                    <button
                        type="button"
                        onClick={fetchReport}
                        disabled={loading}
                        className="rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
                    >

                        {loading
                            ? "Refreshing..."
                            : "Refresh"
                        }

                    </button>

                </div>


                {/* =================================================
                    ERROR
                ================================================= */}

                {!loading &&
                    error && (

                        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-5">

                            <h2 className="font-semibold text-red-800">

                                Unable to load report

                            </h2>


                            <p className="mt-2 text-sm text-red-700">

                                {error}

                            </p>


                            <button
                                type="button"
                                onClick={fetchReport}
                                className="mt-4 rounded-lg bg-red-700 px-4 py-2 text-sm font-medium text-white hover:bg-red-800"
                            >

                                Try Again

                            </button>

                        </div>

                    )}


                {/* =================================================
                    LOADING
                ================================================= */}

                {loading && (

                    <div className="rounded-xl bg-white p-10 text-center shadow-sm">

                        <p className="text-gray-500">

                            Loading company report...

                        </p>

                    </div>

                )}


                {/* =================================================
                    REPORT
                ================================================= */}

                {!loading &&
                    !error &&
                    report && (

                        <>

                            {/* =================================================
                                USER OVERVIEW
                            ================================================= */}

                            <section className="mb-8">

                                <h2 className="mb-4 text-lg font-semibold text-gray-900">

                                    User Overview

                                </h2>


                                <div className="grid grid-cols-1 gap-5 md:grid-cols-3">


                                    {/* TOTAL USERS */}

                                    <div className="rounded-xl bg-white p-6 shadow-sm">

                                        <p className="text-sm font-medium text-gray-500">

                                            Total Users

                                        </p>


                                        <p className="mt-3 text-3xl font-bold text-gray-900">

                                            {
                                                number(
                                                    report.total_users,
                                                )
                                            }

                                        </p>


                                        <p className="mt-2 text-xs text-gray-400">

                                            All users in your company

                                        </p>

                                    </div>


                                    {/* AGENTS */}

                                    <div className="rounded-xl bg-white p-6 shadow-sm">

                                        <p className="text-sm font-medium text-gray-500">

                                            Agents

                                        </p>


                                        <p className="mt-3 text-3xl font-bold text-gray-900">

                                            {
                                                number(
                                                    report.total_agents,
                                                )
                                            }

                                        </p>


                                        <p className="mt-2 text-xs text-gray-400">

                                            Registered agents

                                        </p>

                                    </div>


                                    {/* FINANCE USERS */}

                                    <div className="rounded-xl bg-white p-6 shadow-sm">

                                        <p className="text-sm font-medium text-gray-500">

                                            Finance Users

                                        </p>


                                        <p className="mt-3 text-3xl font-bold text-gray-900">

                                            {
                                                number(
                                                    report.total_finance_users,
                                                )
                                            }

                                        </p>


                                        <p className="mt-2 text-xs text-gray-400">

                                            Finance team members

                                        </p>

                                    </div>

                                </div>

                            </section>


                            {/* =================================================
                                COMMISSION RULE OVERVIEW
                            ================================================= */}

                            <section className="mb-8">

                                <h2 className="mb-4 text-lg font-semibold text-gray-900">

                                    Commission Rules

                                </h2>


                                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">


                                    {/* TOTAL RULES */}

                                    <div className="rounded-xl bg-white p-6 shadow-sm">

                                        <p className="text-sm font-medium text-gray-500">

                                            Total Commission Rules

                                        </p>


                                        <p className="mt-3 text-3xl font-bold text-gray-900">

                                            {
                                                number(
                                                    report.total_commission_rules,
                                                )
                                            }

                                        </p>


                                        <p className="mt-2 text-xs text-gray-400">

                                            Configured commission rules

                                        </p>

                                    </div>


                                    {/* ACTIVE RULES */}

                                    <div className="rounded-xl border border-green-200 bg-green-50 p-6">

                                        <p className="text-sm font-medium text-green-700">

                                            Active Commission Rules

                                        </p>


                                        <p className="mt-3 text-3xl font-bold text-green-900">

                                            {
                                                number(
                                                    report.active_commission_rules,
                                                )
                                            }

                                        </p>


                                        <p className="mt-2 text-xs text-green-600">

                                            Currently active rules

                                        </p>

                                    </div>

                                </div>

                            </section>


                            {/* =================================================
                                BOOKING OVERVIEW
                            ================================================= */}

                            <section className="mb-8">

                                <h2 className="mb-4 text-lg font-semibold text-gray-900">

                                    Booking Overview

                                </h2>


                                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">


                                    {/* TOTAL BOOKINGS */}

                                    <div className="rounded-xl bg-white p-6 shadow-sm">

                                        <p className="text-sm font-medium text-gray-500">

                                            Total Bookings

                                        </p>


                                        <p className="mt-3 text-3xl font-bold text-gray-900">

                                            {
                                                number(
                                                    report.total_bookings,
                                                )
                                            }

                                        </p>


                                        <p className="mt-2 text-xs text-gray-400">

                                            Total bookings recorded

                                        </p>

                                    </div>


                                    {/* GROSS VOLUME */}

                                    <div className="rounded-xl bg-white p-6 shadow-sm">

                                        <p className="text-sm font-medium text-gray-500">

                                            Booking Volume

                                        </p>


                                        <p className="mt-3 text-3xl font-bold text-gray-900">

                                            LKR{" "}

                                            {
                                                money(
                                                    report.gross_volume,
                                                )
                                            }

                                        </p>


                                        <p className="mt-2 text-xs text-gray-400">

                                            Total booking value

                                        </p>

                                    </div>

                                </div>

                            </section>


                            {/* =================================================
                                COMMISSION OVERVIEW
                            ================================================= */}

                            <section className="mb-8">

                                <h2 className="mb-4 text-lg font-semibold text-gray-900">

                                    Commission Overview

                                </h2>


                                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">


                                    {/* TOTAL COMMISSION */}

                                    <div className="rounded-xl bg-white p-6 shadow-sm">

                                        <p className="text-sm font-medium text-gray-500">

                                            Total Commission

                                        </p>


                                        <p className="mt-3 text-3xl font-bold text-gray-900">

                                            LKR{" "}

                                            {
                                                money(
                                                    report.total_commission,
                                                )
                                            }

                                        </p>


                                        <p className="mt-2 text-xs text-gray-400">

                                            Total commission generated

                                        </p>

                                    </div>


                                    {/* RULE STATUS */}

                                    <div className="rounded-xl bg-white p-6 shadow-sm">

                                        <p className="text-sm font-medium text-gray-500">

                                            Rule Status

                                        </p>


                                        <div className="mt-4 flex items-center gap-4">

                                            <div>

                                                <p className="text-2xl font-bold text-green-600">

                                                    {
                                                        number(
                                                            report.active_commission_rules,
                                                        )
                                                    }

                                                </p>

                                                <p className="text-xs text-gray-500">

                                                    Active

                                                </p>

                                            </div>


                                            <div className="h-10 w-px bg-gray-200" />


                                            <div>

                                                <p className="text-2xl font-bold text-gray-900">

                                                    {
                                                        number(
                                                            report.total_commission_rules,
                                                        )
                                                    }

                                                </p>

                                                <p className="text-xs text-gray-500">

                                                    Total

                                                </p>

                                            </div>

                                        </div>

                                    </div>

                                </div>

                            </section>


                            {/* =================================================
                                INFORMATION
                            ================================================= */}

                            <div className="rounded-xl border border-blue-200 bg-blue-50 p-5">

                                <h3 className="font-semibold text-blue-900">

                                    Admin Report

                                </h3>


                                <p className="mt-2 text-sm leading-6 text-blue-800">

                                    This report provides a high-level
                                    overview of your company's users,
                                    commission rules, bookings, and
                                    commission activity.

                                    Payout run details and product
                                    override amounts are intentionally
                                    excluded from this report.

                                </p>

                            </div>

                        </>

                    )}

            </main>

        </div>

    );

}


export default Reports;