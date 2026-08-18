import { useEffect, useState } from "react";

import { useAuth } from "../../context/AuthContext";
import {
    useAuthorizationCheck,
} from "../../authorization/AuthorizationCheck";

import SidebarAgent from "../../component/layout/sidebar-agent";
import api from "../../services/api";


interface AgentStatement {
    payout_run_id: string;
    run_no: number;
    period_start: string;
    period_end: string;
    status: "DRAFT" | "FINALISED";

    agent_code: string;

    booking_count: number;
    gross_volume: string | number;
    commission_rate: string | number;
    commission_amount: string | number;
}


function AgentReports() {

    const {
        isLoading,
    } = useAuth();

    const {
        agentAuthorization,
    } = useAuthorizationCheck();


    const [statements, setStatements] =
        useState<AgentStatement[]>([]);

    const [loading, setLoading] =
        useState(true);

    const [error, setError] =
        useState("");


    useEffect(() => {

        if (!isLoading) {

            agentAuthorization();

            fetchStatement();

        }

    }, [isLoading]);


    async function fetchStatement() {

        try {

            setLoading(true);
            setError("");


            const response =
                await api.get(
                    "/reports/agent/statement",
                );


            console.log(
                "AGENT STATEMENT RESPONSE:",
                response.data,
            );


            const statement =
                response.data?.data?.statement;


            if (!Array.isArray(statement)) {

                throw new Error(
                    "Agent statement was not returned by the server.",
                );

            }


            setStatements(statement);


        } catch (err: any) {

            console.error(
                "Agent report error:",
                err,
            );


            setError(
                err?.response?.data?.error?.message ||
                err?.message ||
                "Failed to load agent statement.",
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


    function formatDate(
        value: string,
    ): string {

        return new Date(
            value,
        ).toLocaleDateString(
            "en-GB",
        );

    }


    /*
     * Calculate totals from the agent's
     * payout statements.
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


    if (isLoading) {

        return (
            <div className="flex min-h-screen items-center justify-center">
                Loading...
            </div>
        );

    }


    return (
        <div className="flex min-h-screen bg-gray-50">

            <SidebarAgent
                activeItem="Export Statements"
            />


            <main className="flex-1 p-8">

                {/* Header */}

                <div className="mb-8">

                    <h1 className="text-3xl font-bold text-gray-900">
                        Reports & Statements
                    </h1>

                    <p className="mt-2 text-gray-500">
                        View your payout and commission statements.
                    </p>

                </div>


                {/* Loading */}

                {loading && (

                    <div className="rounded-xl bg-white p-8 shadow-sm">

                        <p className="text-gray-500">
                            Loading statement...
                        </p>

                    </div>

                )}


                {/* Error */}

                {!loading && error && (

                    <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-red-700">

                        {error}

                    </div>

                )}


                {!loading && !error && (

                    <>

                        {/* Summary Cards */}

                        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">


                            {/* Bookings */}

                            <div className="rounded-xl bg-white p-6 shadow-sm">

                                <p className="text-sm font-medium text-gray-500">
                                    Total Bookings
                                </p>

                                <p className="mt-3 text-3xl font-bold text-gray-900">
                                    {totalBookings}
                                </p>

                            </div>


                            {/* Volume */}

                            <div className="rounded-xl bg-white p-6 shadow-sm">

                                <p className="text-sm font-medium text-gray-500">
                                    Booking Volume
                                </p>

                                <p className="mt-3 text-3xl font-bold text-gray-900">
                                    LKR{" "}
                                    {money(totalVolume)}
                                </p>

                            </div>


                            {/* Commission */}

                            <div className="rounded-xl bg-white p-6 shadow-sm">

                                <p className="text-sm font-medium text-gray-500">
                                    Total Commission
                                </p>

                                <p className="mt-3 text-3xl font-bold text-gray-900">
                                    LKR{" "}
                                    {money(totalCommission)}
                                </p>

                            </div>

                        </div>


                        {/* Statement */}

                        <div className="mt-8 rounded-xl bg-white shadow-sm">

                            <div className="border-b border-gray-200 p-6">

                                <h2 className="text-lg font-semibold text-gray-900">
                                    Payout Statements
                                </h2>

                                <p className="mt-1 text-sm text-gray-500">
                                    Your payout history by payout run.
                                </p>

                            </div>


                            {statements.length === 0 ? (

                                <div className="p-8 text-center">

                                    <h3 className="text-lg font-semibold text-gray-900">
                                        No payout statements
                                    </h3>

                                    <p className="mt-2 text-sm text-gray-500">
                                        You do not have any payout statements yet.
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
                                                    Gross Volume
                                                </th>

                                                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                                                    Rate
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

                                                        {/* Run */}

                                                        <td className="px-6 py-4 text-sm font-medium text-gray-900">

                                                            #{statement.run_no}

                                                        </td>


                                                        {/* Period */}

                                                        <td className="px-6 py-4 text-sm text-gray-600">

                                                            {formatDate(
                                                                statement.period_start,
                                                            )}

                                                            {" → "}

                                                            {formatDate(
                                                                statement.period_end,
                                                            )}

                                                        </td>


                                                        {/* Bookings */}

                                                        <td className="px-6 py-4 text-sm text-gray-600">

                                                            {statement.booking_count}

                                                        </td>


                                                        {/* Volume */}

                                                        <td className="px-6 py-4 text-sm font-medium text-gray-900">

                                                            LKR{" "}
                                                            {money(
                                                                statement.gross_volume,
                                                            )}

                                                        </td>


                                                        {/* Rate */}

                                                        <td className="px-6 py-4 text-sm text-gray-600">

                                                            {money(
                                                                statement.commission_rate,
                                                            )}
                                                            %

                                                        </td>


                                                        {/* Commission */}

                                                        <td className="px-6 py-4 text-sm font-semibold text-gray-900">

                                                            LKR{" "}
                                                            {money(
                                                                statement.commission_amount,
                                                            )}

                                                        </td>


                                                        {/* Status */}

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

                    </>

                )}

            </main>

        </div>
    );
}


export default AgentReports;