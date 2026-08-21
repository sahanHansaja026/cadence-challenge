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

    /*
     * PRODUCT OVERRIDE
     */
    override_rate: string | number | null;

    override_volume: string | number;

    override_commission_amount: string | number;

    override_applied: boolean;

    created_at?: string;
}


function AgentReports() {

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
     * --------------------------------------------------
     * AUTHORIZATION
     * --------------------------------------------------
     */

    useEffect(() => {

        if (!isLoading) {

            agentAuthorization();

            fetchStatement();

        }

    }, [isLoading]);


    /*
     * --------------------------------------------------
     * LOAD AGENT STATEMENT
     * --------------------------------------------------
     */

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


            setStatements(
                statement,
            );


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


    /*
     * --------------------------------------------------
     * MONEY FORMAT
     * --------------------------------------------------
     */

    function money(
        value: string | number | undefined | null,
    ): string {

        const amount =
            Number(
                value ?? 0,
            );


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
     * --------------------------------------------------
     * DATE FORMAT
     * --------------------------------------------------
     */

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
     * --------------------------------------------------
     * SUMMARY CALCULATIONS
     * --------------------------------------------------
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


    /*
     * Normal / total commission returned
     * by the payout service.
     */
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


    /*
     * --------------------------------------------------
     * OVERRIDE TOTALS
     * --------------------------------------------------
     */

    const totalOverrideVolume =
        statements.reduce(
            (
                total,
                statement,
            ) =>
                total +
                Number(
                    statement.override_volume ?? 0,
                ),
            0,
        );


    const totalOverrideCommission =
        statements.reduce(
            (
                total,
                statement,
            ) =>
                total +
                Number(
                    statement.override_commission_amount ?? 0,
                ),
            0,
        );


    const overrideCount =
        statements.filter(
            statement =>
                statement.override_applied === true ||
                Number(
                    statement.override_commission_amount ?? 0,
                ) > 0,
        ).length;


    /*
     * --------------------------------------------------
     * LOADING
     * --------------------------------------------------
     */

    if (isLoading) {

        return (
            <div className="flex min-h-screen items-center justify-center">

                Loading...

            </div>
        );

    }


    /*
     * --------------------------------------------------
     * PAGE
     * --------------------------------------------------
     */

    return (
        <div className="flex min-h-screen bg-gray-50">

            {/* SIDEBAR */}

            <SidebarAgent
                activeItem="Export Statements"
            />


            {/* MAIN */}

            <main className="flex-1 p-8">

                {/* HEADER */}

                <div className="mb-8">

                    <h1 className="text-3xl font-bold text-gray-900">
                        Reports & Statements
                    </h1>

                    <p className="mt-2 text-gray-500">
                        View your payout, commission, and product
                        override statements.
                    </p>

                </div>


                {/* LOADING */}

                {loading && (

                    <div className="rounded-xl bg-white p-8 shadow-sm">

                        <p className="text-gray-500">
                            Loading statement...
                        </p>

                    </div>

                )}


                {/* ERROR */}

                {!loading &&
                    error && (

                        <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-red-700">

                            {error}

                        </div>

                    )}


                {/* DATA */}

                {!loading &&
                    !error && (

                        <>

                            {/* ------------------------------------------------ */}
                            {/* SUMMARY CARDS */}
                            {/* ------------------------------------------------ */}

                            <div className="grid grid-cols-1 gap-6 md:grid-cols-5">

                                {/* BOOKINGS */}

                                <div className="rounded-xl bg-white p-6 shadow-sm">

                                    <p className="text-sm font-medium text-gray-500">
                                        Total Bookings
                                    </p>

                                    <p className="mt-3 text-3xl font-bold text-gray-900">

                                        {totalBookings}

                                    </p>

                                </div>


                                {/* VOLUME */}

                                <div className="rounded-xl bg-white p-6 shadow-sm">

                                    <p className="text-sm font-medium text-gray-500">
                                        Booking Volume
                                    </p>

                                    <p className="mt-3 text-2xl font-bold text-gray-900">

                                        LKR{" "}

                                        {money(
                                            totalVolume,
                                        )}

                                    </p>

                                </div>


                                {/* TOTAL COMMISSION */}

                                <div className="rounded-xl bg-white p-6 shadow-sm">

                                    <p className="text-sm font-medium text-gray-500">
                                        Total Commission
                                    </p>

                                    <p className="mt-3 text-2xl font-bold text-gray-900">

                                        LKR{" "}

                                        {money(
                                            totalCommission,
                                        )}

                                    </p>

                                </div>


                                {/* OVERRIDE VOLUME */}

                                <div className="rounded-xl border border-purple-200 bg-purple-50 p-6">

                                    <p className="text-sm font-medium text-purple-700">
                                        Override Volume
                                    </p>

                                    <p className="mt-3 text-2xl font-bold text-purple-900">

                                        LKR{" "}

                                        {money(
                                            totalOverrideVolume,
                                        )}

                                    </p>

                                </div>


                                {/* OVERRIDE COMMISSION */}

                                <div className="rounded-xl border border-purple-200 bg-purple-50 p-6">

                                    <p className="text-sm font-medium text-purple-700">
                                        Override Commission
                                    </p>

                                    <p className="mt-3 text-2xl font-bold text-purple-900">

                                        LKR{" "}

                                        {money(
                                            totalOverrideCommission,
                                        )}

                                    </p>

                                </div>

                            </div>


                            {/* ------------------------------------------------ */}
                            {/* OVERRIDE SUMMARY */}
                            {/* ------------------------------------------------ */}

                            <div className="mt-8 rounded-xl border border-purple-200 bg-purple-50 p-6">

                                <div className="flex flex-col justify-between gap-4 md:flex-row">

                                    <div>

                                        <h2 className="text-lg font-semibold text-purple-900">
                                            Product Override Summary
                                        </h2>

                                        <p className="mt-1 text-sm text-purple-700">

                                            Product override commissions are
                                            applied instead of the normal
                                            tiered commission when a booking
                                            matches the configured rule.

                                        </p>

                                    </div>


                                    <div className="rounded-lg bg-white px-5 py-3">

                                        <p className="text-xs font-semibold uppercase text-gray-500">
                                            Runs With Override
                                        </p>

                                        <p className="mt-1 text-xl font-bold text-purple-900">

                                            {overrideCount}

                                        </p>

                                    </div>

                                </div>


                                <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3">

                                    <div className="rounded-lg bg-white p-4">

                                        <p className="text-xs font-medium text-gray-500">
                                            Override Volume
                                        </p>

                                        <p className="mt-2 text-xl font-bold text-gray-900">

                                            LKR{" "}

                                            {money(
                                                totalOverrideVolume,
                                            )}

                                        </p>

                                    </div>


                                    <div className="rounded-lg bg-white p-4">

                                        <p className="text-xs font-medium text-gray-500">
                                            Override Commission
                                        </p>

                                        <p className="mt-2 text-xl font-bold text-gray-900">

                                            LKR{" "}

                                            {money(
                                                totalOverrideCommission,
                                            )}

                                        </p>

                                    </div>


                                    <div className="rounded-lg bg-white p-4">

                                        <p className="text-xs font-medium text-gray-500">
                                            Override Applied
                                        </p>

                                        <p className="mt-2 text-xl font-bold">

                                            {totalOverrideCommission > 0 ? (

                                                <span className="text-green-600">
                                                    YES
                                                </span>

                                            ) : (

                                                <span className="text-gray-500">
                                                    NO
                                                </span>

                                            )}

                                        </p>

                                    </div>

                                </div>

                            </div>


                            {/* ------------------------------------------------ */}
                            {/* PAYOUT STATEMENTS */}
                            {/* ------------------------------------------------ */}

                            <div className="mt-8 overflow-hidden rounded-xl bg-white shadow-sm">

                                <div className="border-b border-gray-200 p-6">

                                    <h2 className="text-lg font-semibold text-gray-900">
                                        Payout Statements
                                    </h2>

                                    <p className="mt-1 text-sm text-gray-500">
                                        Your payout history by payout run,
                                        including product override details.
                                    </p>

                                </div>


                                {statements.length === 0 ? (

                                    <div className="p-10 text-center">

                                        <h3 className="text-lg font-semibold text-gray-900">
                                            No payout statements
                                        </h3>

                                        <p className="mt-2 text-sm text-gray-500">
                                            You do not have any payout
                                            statements yet.
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
                                                        Normal Rate
                                                    </th>

                                                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                                                        Override
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
                                                    ) => {

                                                        const hasOverride =
                                                            statement.override_applied === true ||
                                                            Number(
                                                                statement.override_commission_amount ?? 0,
                                                            ) > 0;


                                                        return (

                                                            <tr
                                                                key={
                                                                    statement.payout_run_id
                                                                }
                                                                className="hover:bg-gray-50"
                                                            >

                                                                {/* RUN */}

                                                                <td className="px-6 py-4">

                                                                    <p className="font-medium text-gray-900">

                                                                        #{statement.run_no}

                                                                    </p>

                                                                    <p className="mt-1 text-xs text-gray-500">

                                                                        {
                                                                            statement.payout_run_id
                                                                        }

                                                                    </p>

                                                                </td>


                                                                {/* PERIOD */}

                                                                <td className="px-6 py-4 text-sm text-gray-600">

                                                                    {formatDate(
                                                                        statement.period_start,
                                                                    )}

                                                                    {" → "}

                                                                    {formatDate(
                                                                        statement.period_end,
                                                                    )}

                                                                </td>


                                                                {/* BOOKINGS */}

                                                                <td className="px-6 py-4 text-sm font-medium text-gray-900">

                                                                    {
                                                                        statement.booking_count
                                                                    }

                                                                </td>


                                                                {/* GROSS */}

                                                                <td className="px-6 py-4 text-sm font-medium text-gray-900">

                                                                    LKR{" "}

                                                                    {money(
                                                                        statement.gross_volume,
                                                                    )}

                                                                </td>


                                                                {/* NORMAL RATE */}

                                                                <td className="px-6 py-4 text-sm text-gray-600">

                                                                    {money(
                                                                        statement.commission_rate,
                                                                    )}

                                                                    %

                                                                </td>


                                                                {/* OVERRIDE */}

                                                                <td className="px-6 py-4">

                                                                    {hasOverride ? (

                                                                        <div className="min-w-[190px] rounded-lg border border-purple-200 bg-purple-50 p-3">

                                                                            <div className="flex items-center gap-2">

                                                                                <span className="rounded-full bg-purple-100 px-2 py-1 text-xs font-bold text-purple-700">

                                                                                    OVERRIDE

                                                                                </span>

                                                                            </div>


                                                                            <p className="mt-2 text-sm font-semibold text-purple-900">

                                                                                Rate:{" "}

                                                                                {money(
                                                                                    statement.override_rate,
                                                                                )}

                                                                                %

                                                                            </p>


                                                                            <p className="mt-1 text-xs text-purple-700">

                                                                                Volume: LKR{" "}

                                                                                {money(
                                                                                    statement.override_volume,
                                                                                )}

                                                                            </p>


                                                                            <p className="mt-1 text-xs font-semibold text-purple-800">

                                                                                Commission: LKR{" "}

                                                                                {money(
                                                                                    statement.override_commission_amount,
                                                                                )}

                                                                            </p>

                                                                        </div>

                                                                    ) : (

                                                                        <span className="text-sm text-gray-400">

                                                                            No override

                                                                        </span>

                                                                    )}

                                                                </td>


                                                                {/* TOTAL COMMISSION */}

                                                                <td className="px-6 py-4">

                                                                    <p className="text-sm font-semibold text-gray-900">

                                                                        LKR{" "}

                                                                        {money(
                                                                            statement.commission_amount,
                                                                        )}

                                                                    </p>


                                                                    {hasOverride && (

                                                                        <p className="mt-1 text-xs text-purple-600">

                                                                            Includes override

                                                                        </p>

                                                                    )}

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

                                                        );

                                                    },
                                                )}

                                            </tbody>

                                        </table>

                                    </div>

                                )}

                            </div>


                            {/* ------------------------------------------------ */}
                            {/* CALCULATION DETAILS */}
                            {/* ------------------------------------------------ */}

                            <div className="mt-8 rounded-xl border border-gray-200 bg-white p-6">

                                <h2 className="text-lg font-semibold text-gray-900">
                                    Commission Calculation
                                </h2>

                                <p className="mt-2 text-sm text-gray-500">

                                    The commission shown in the statement is
                                    calculated from the bookings included in
                                    each payout run.

                                </p>


                                <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3">

                                    <div className="rounded-lg bg-gray-50 p-4">

                                        <p className="text-xs font-semibold uppercase text-gray-500">
                                            Gross Volume
                                        </p>

                                        <p className="mt-2 font-bold text-gray-900">

                                            LKR{" "}

                                            {money(
                                                totalVolume,
                                            )}

                                        </p>

                                    </div>


                                    <div className="rounded-lg bg-gray-50 p-4">

                                        <p className="text-xs font-semibold uppercase text-gray-500">
                                            Normal Commission
                                        </p>

                                        <p className="mt-2 font-bold text-gray-900">

                                            LKR{" "}

                                            {money(
                                                totalCommission,
                                            )}

                                        </p>

                                    </div>


                                    <div className="rounded-lg bg-purple-50 p-4">

                                        <p className="text-xs font-semibold uppercase text-purple-700">
                                            Override Commission
                                        </p>

                                        <p className="mt-2 font-bold text-purple-900">

                                            LKR{" "}

                                            {money(
                                                totalOverrideCommission,
                                            )}

                                        </p>

                                    </div>

                                </div>


                                <div className="mt-5 rounded-lg border border-blue-100 bg-blue-50 p-4">

                                    <p className="text-sm leading-6 text-blue-900">

                                        <strong>Override rule:</strong>{" "}

                                        When a booking matches a Product
                                        Override rule by product, amount
                                        range, and effective date, the
                                        override rate is used for that
                                        booking instead of the normal tiered
                                        commission rate. The override
                                        commission is not added on top of the
                                        normal commission.

                                    </p>

                                </div>

                            </div>

                        </>

                    )}

            </main>

        </div>
    );

}


export default AgentReports;