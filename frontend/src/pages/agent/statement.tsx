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

import SidebarAgent from "../../component/layout/sidebar-agent";

import api from "../../services/api";


/*
 * =========================================================
 * TYPES
 * =========================================================
 */

interface AgentStatement {

    payout_run_id: string;

    run_no: number;

    period_start: string;

    period_end: string;

    status:
    | "DRAFT"
    | "FINALISED";

    agent_code: string;

    booking_count: number;

    gross_volume: string | number;

    commission_rate: string | number;

    commission_amount: string | number;
}


/*
 * =========================================================
 * COMPONENT
 * =========================================================
 */

function AgentReport() {

    const {
        isLoading,
    } = useAuth();


    const {
        agentAuthorization,
    } = useAuthorizationCheck();


    const [
        statements,
        setStatements,
    ] = useState<AgentStatement[]>([]);


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
     * AGENT AUTHORIZATION
     * =========================================================
     */

    useEffect(() => {

        if (!isLoading) {

            agentAuthorization();

        }

    }, [isLoading]);


    /*
     * =========================================================
     * LOAD AGENT REPORT
     * =========================================================
 */

    useEffect(() => {

        if (!isLoading) {

            fetchAgentReport();

        }

    }, [isLoading]);


    /*
     * =========================================================
     * FETCH REPORT
     * =========================================================
     */

    async function fetchAgentReport() {

        try {

            setLoading(true);

            setError("");


            const response =
                await api.get(
                    "/reports/agent/statement",
                );


            console.log(
                "AGENT REPORT:",
                response.data,
            );


            const data =
                response.data?.data?.statement;


            if (!data) {

                throw new Error(
                    "Agent statement was not returned by the server.",
                );

            }


            setStatements(data);


        } catch (err: any) {

            console.error(
                "Agent report error:",
                err,
            );


            setError(
                err?.response?.data?.error?.message ||
                err?.message ||
                "Unable to load your report.",
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
     * DATE FORMAT
     * =========================================================
     */

    function formatDate(
        value: string,
    ): string {

        if (!value) {

            return "-";

        }


        const date =
            new Date(value);


        if (
            Number.isNaN(
                date.getTime(),
            )
        ) {

            return value;

        }


        return date.toLocaleDateString(
            "en-GB",
        );

    }


    /*
     * =========================================================
     * SUMMARY CALCULATIONS
     * =========================================================
     */

    const totalBookings =
        statements.reduce(
            (
                total,
                statement,
            ) =>
                total +
                Number(
                    statement.booking_count ?? 0,
                ),
            0,
        );


    const totalVolume =
        statements.reduce(
            (
                total,
                statement,
            ) =>
                total +
                Number(
                    statement.gross_volume ?? 0,
                ),
            0,
        );


    const totalCommission =
        statements.reduce(
            (
                total,
                statement,
            ) =>
                total +
                Number(
                    statement.commission_amount ?? 0,
                ),
            0,
        );


    const finalisedRuns =
        statements.filter(
            statement =>
                statement.status === "FINALISED",
        ).length;


    const agentCode =
        statements[0]?.agent_code ?? "-";


    /*
     * =========================================================
     * LOADING
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

            <SidebarAgent
                activeItem="Reports"
            />


            {/* =================================================
                MAIN CONTENT
            ================================================= */}

            <main className="flex-1 p-8">


                {/* =================================================
                    HEADER
                ================================================= */}

                <div className="mb-8 flex items-start justify-between">

                    <div>

                        <h1 className="text-3xl font-bold text-gray-900">

                            My Reports

                        </h1>


                        <p className="mt-2 text-gray-500">

                            View your booking, commission,
                            and payout statement.

                        </p>

                    </div>


                    <button
                        type="button"
                        onClick={fetchAgentReport}
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

                {!loading && error && (

                    <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-5">

                        <h2 className="font-semibold text-red-800">

                            Unable to load report

                        </h2>


                        <p className="mt-2 text-sm text-red-700">

                            {error}

                        </p>


                        <button
                            type="button"
                            onClick={fetchAgentReport}
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

                            Loading your report...

                        </p>

                    </div>

                )}


                {/* =================================================
                    REPORT
                ================================================= */}

                {!loading &&
                    !error && (

                        <>


                            {/* =================================================
                                AGENT INFORMATION
                            ================================================= */}

                            <div className="mb-8 rounded-xl bg-white p-6 shadow-sm">

                                <p className="text-sm font-medium text-gray-500">

                                    Agent Code

                                </p>


                                <p className="mt-2 text-2xl font-bold text-gray-900">

                                    {agentCode}

                                </p>


                                <p className="mt-2 text-sm text-gray-500">

                                    This report contains only your
                                    own booking and commission data.

                                </p>

                            </div>


                            {/* =================================================
                                SUMMARY
                            ================================================= */}

                            <div className="mb-8">

                                <h2 className="mb-4 text-lg font-semibold text-gray-900">

                                    My Summary

                                </h2>


                                <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">


                                    {/* BOOKINGS */}

                                    <div className="rounded-xl bg-white p-6 shadow-sm">

                                        <p className="text-sm font-medium text-gray-500">

                                            My Bookings

                                        </p>


                                        <p className="mt-3 text-3xl font-bold text-gray-900">

                                            {
                                                totalBookings.toLocaleString(
                                                    "en-LK",
                                                )
                                            }

                                        </p>

                                    </div>


                                    {/* VOLUME */}

                                    <div className="rounded-xl bg-white p-6 shadow-sm">

                                        <p className="text-sm font-medium text-gray-500">

                                            Booking Volume

                                        </p>


                                        <p className="mt-3 text-2xl font-bold text-gray-900">

                                            LKR{" "}

                                            {
                                                money(
                                                    totalVolume,
                                                )
                                            }

                                        </p>

                                    </div>


                                    {/* COMMISSION */}

                                    <div className="rounded-xl bg-white p-6 shadow-sm">

                                        <p className="text-sm font-medium text-gray-500">

                                            My Commission

                                        </p>


                                        <p className="mt-3 text-2xl font-bold text-gray-900">

                                            LKR{" "}

                                            {
                                                money(
                                                    totalCommission,
                                                )
                                            }

                                        </p>

                                    </div>


                                    {/* FINALISED */}

                                    <div className="rounded-xl bg-white p-6 shadow-sm">

                                        <p className="text-sm font-medium text-gray-500">

                                            Finalised Runs

                                        </p>


                                        <p className="mt-3 text-3xl font-bold text-gray-900">

                                            {
                                                finalisedRuns.toLocaleString(
                                                    "en-LK",
                                                )
                                            }

                                        </p>

                                    </div>

                                </div>

                            </div>


                            {/* =================================================
                                STATEMENT
                            ================================================= */}

                            <div className="overflow-hidden rounded-xl bg-white shadow-sm">


                                <div className="border-b border-gray-200 px-6 py-5">

                                    <h2 className="text-lg font-semibold text-gray-900">

                                        My Payout Statement

                                    </h2>


                                    <p className="mt-1 text-sm text-gray-500">

                                        Your commission and booking
                                        information by payout run.

                                    </p>

                                </div>


                                {statements.length === 0 ? (

                                    <div className="p-10 text-center">

                                        <h3 className="font-semibold text-gray-900">

                                            No statements available

                                        </h3>


                                        <p className="mt-2 text-sm text-gray-500">

                                            No payout information has
                                            been generated for your
                                            account yet.

                                        </p>

                                    </div>

                                ) : (

                                    <div className="overflow-x-auto">

                                        <table className="w-full">

                                            <thead className="border-b border-gray-200 bg-gray-50">

                                                <tr>

                                                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">

                                                        Run

                                                    </th>


                                                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">

                                                        Period

                                                    </th>


                                                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">

                                                        Bookings

                                                    </th>


                                                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">

                                                        Volume

                                                    </th>


                                                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">

                                                        Commission Rate

                                                    </th>


                                                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">

                                                        Commission

                                                    </th>


                                                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">

                                                        Status

                                                    </th>

                                                </tr>

                                            </thead>


                                            <tbody className="divide-y divide-gray-200">

                                                {statements.map(
                                                    (
                                                        statement,
                                                    ) => (

                                                        <tr
                                                            key={
                                                                statement.payout_run_id
                                                            }
                                                            className="hover:bg-gray-50"
                                                        >


                                                            {/* RUN */}

                                                            <td className="px-6 py-4">

                                                                <span className="font-medium text-gray-900">

                                                                    #
                                                                    {
                                                                        statement.run_no
                                                                    }

                                                                </span>

                                                            </td>


                                                            {/* PERIOD */}

                                                            <td className="px-6 py-4 text-sm text-gray-600">

                                                                {
                                                                    formatDate(
                                                                        statement.period_start,
                                                                    )
                                                                }

                                                                {" → "}

                                                                {
                                                                    formatDate(
                                                                        statement.period_end,
                                                                    )
                                                                }

                                                            </td>


                                                            {/* BOOKINGS */}

                                                            <td className="px-6 py-4 text-sm font-medium text-gray-900">

                                                                {
                                                                    Number(
                                                                        statement.booking_count ?? 0,
                                                                    ).toLocaleString(
                                                                        "en-LK",
                                                                    )
                                                                }

                                                            </td>


                                                            {/* VOLUME */}

                                                            <td className="px-6 py-4 text-sm text-gray-900">

                                                                LKR{" "}

                                                                {
                                                                    money(
                                                                        statement.gross_volume,
                                                                    )
                                                                }

                                                            </td>


                                                            {/* RATE */}

                                                            <td className="px-6 py-4 text-sm text-gray-900">

                                                                {
                                                                    money(
                                                                        statement.commission_rate,
                                                                    )
                                                                }
                                                                %

                                                            </td>


                                                            {/* COMMISSION */}

                                                            <td className="px-6 py-4 text-sm font-semibold text-gray-900">

                                                                LKR{" "}

                                                                {
                                                                    money(
                                                                        statement.commission_amount,
                                                                    )
                                                                }

                                                            </td>


                                                            {/* STATUS */}

                                                            <td className="px-6 py-4">

                                                                <span
                                                                    className={
                                                                        `rounded-full px-3 py-1 text-xs font-medium ${statement.status ===
                                                                            "FINALISED"
                                                                            ? "bg-green-100 text-green-700"
                                                                            : "bg-yellow-100 text-yellow-700"
                                                                        }`
                                                                    }
                                                                >

                                                                    {
                                                                        statement.status
                                                                    }

                                                                </span>

                                                            </td>

                                                        </tr>

                                                    ),
                                                )}

                                            </tbody>

                                        </table>

                                    </div>

                                )}

                            </div>


                            {/* =================================================
                                INFORMATION
                            ================================================= */}

                            <div className="mt-6 rounded-xl border border-blue-200 bg-blue-50 p-5">

                                <h3 className="font-semibold text-blue-900">

                                    Agent Report

                                </h3>


                                <p className="mt-2 text-sm leading-6 text-blue-800">

                                    This report shows only your own
                                    booking, commission, and payout
                                    information. You cannot view
                                    another agent's financial data,
                                    company-wide commission rules,
                                    or other users' information.

                                </p>

                            </div>

                        </>

                    )}

            </main>

        </div>

    );

}


export default AgentReport;