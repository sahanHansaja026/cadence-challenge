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


interface AgentPayout {

    payout_run_id: string;

    run_no: number;

    period_start: string;

    period_end: string;

    payout_status:
    | "DRAFT"
    | "FINALISED";

    agent_code: string;

    booking_count: number;

    gross_volume: string;

    commission_rate: string;

    commission_amount: string;

    /*
     * PRODUCT OVERRIDE
     */
    override_rate: string | null;

    override_volume: string;

    override_commission_amount: string;

    created_at: string;
}


function AgentPayouts() {

    const {
        user,
        isLoading,
    } = useAuth();


    const {
        agentAuthorization,
    } = useAuthorizationCheck();


    const [
        payouts,
        setPayouts,
    ] = useState<AgentPayout[]>([]);


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

        }

    }, [isLoading]);


    /*
     * --------------------------------------------------
     * LOAD PAYOUTS
     * --------------------------------------------------
     */

    useEffect(() => {

        if (!isLoading) {

            fetchPayouts();

        }

    }, [isLoading]);


    async function fetchPayouts() {

        try {

            setLoading(true);

            setError("");


            /*
             * JWT interceptor automatically
             * sends Authorization header.
             */

            const response =
                await api.get(
                    "/payout-runs/agent/payouts",
                );


            setPayouts(
                response.data.data?.payouts ?? [],
            );


        } catch (err) {

            console.error(
                "Agent payouts error:",
                err,
            );


            setError(
                "Unable to load your payouts.",
            );


        } finally {

            setLoading(false);

        }
    }


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
     * SUMMARY
     * --------------------------------------------------
     */

    const totalCommission =
        payouts.reduce(
            (
                total,
                payout,
            ) =>
                total +
                Number(
                    payout.commission_amount,
                ),
            0,
        );


    const totalGrossVolume =
        payouts.reduce(
            (
                total,
                payout,
            ) =>
                total +
                Number(
                    payout.gross_volume,
                ),
            0,
        );


    const totalBookings =
        payouts.reduce(
            (
                total,
                payout,
            ) =>
                total +
                Number(
                    payout.booking_count,
                ),
            0,
        );


    /*
     * TOTAL OVERRIDE COMMISSION
     */

    const totalOverrideCommission =
        payouts.reduce(
            (
                total,
                payout,
            ) =>
                total +
                Number(
                    payout.override_commission_amount ||
                    0,
                ),
            0,
        );


    /*
     * TOTAL OVERRIDE VOLUME
     */

    const totalOverrideVolume =
        payouts.reduce(
            (
                total,
                payout,
            ) =>
                total +
                Number(
                    payout.override_volume ||
                    0,
                ),
            0,
        );


    return (
        <div className="flex min-h-screen bg-gray-50">

            {/* SIDEBAR */}

            <SidebarAgent
                activeItem="My Payout Statements"
            />


            {/* MAIN */}

            <main className="flex-1 p-8">

                {/* HEADER */}

                <div className="mb-8">

                    <h1 className="text-3xl font-bold text-gray-900">
                        My Payouts
                    </h1>

                    <p className="mt-2 text-gray-500">
                        View your payout runs and commission earnings.
                    </p>

                </div>


                {/* AGENT INFORMATION */}

                <div className="mb-6 rounded-xl border border-gray-200 bg-white p-6">

                    <h2 className="text-lg font-semibold text-gray-900">
                        Agent Account
                    </h2>


                    <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">

                        <div className="rounded-lg bg-gray-50 p-4">

                            <p className="text-xs font-semibold uppercase text-gray-500">
                                Email
                            </p>

                            <p className="mt-1 font-medium text-gray-900">
                                {user?.email ?? "Unknown"}
                            </p>

                        </div>


                        <div className="rounded-lg bg-gray-50 p-4">

                            <p className="text-xs font-semibold uppercase text-gray-500">
                                Role
                            </p>

                            <p className="mt-1 font-medium text-gray-900">
                                {user?.role ?? "Unknown"}
                            </p>

                        </div>


                        <div className="rounded-lg bg-blue-50 p-4">

                            <p className="text-xs font-semibold uppercase text-blue-600">
                                Company
                            </p>

                            <p className="mt-1 break-all font-medium text-blue-900">
                                {user?.companyId ?? "Unknown"}
                            </p>

                        </div>

                    </div>

                </div>


                {/* LOADING */}

                {loading && (

                    <div className="rounded-xl bg-white p-8 text-center shadow-sm">

                        <p className="text-gray-500">
                            Loading your payouts...
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


                {/* EMPTY */}

                {!loading &&
                    !error &&
                    payouts.length === 0 && (

                        <div className="rounded-xl bg-white p-10 text-center shadow-sm">

                            <h2 className="text-lg font-semibold text-gray-900">
                                No payouts found
                            </h2>

                            <p className="mt-2 text-sm text-gray-500">
                                You currently have no payout records.
                            </p>

                        </div>

                    )}


                {/* PAYOUT DATA */}

                {!loading &&
                    !error &&
                    payouts.length > 0 && (

                        <>

                            {/* SUMMARY */}

                            <div className="mb-6 grid grid-cols-1 gap-5 md:grid-cols-5">

                                {/* TOTAL */}

                                <div className="rounded-xl bg-white p-6 shadow-sm">

                                    <p className="text-sm text-gray-500">
                                        Total Payout
                                    </p>

                                    <p className="mt-2 text-2xl font-bold text-gray-900">

                                        LKR{" "}

                                        {totalCommission.toLocaleString(
                                            "en-LK",
                                            {
                                                minimumFractionDigits: 2,
                                                maximumFractionDigits: 2,
                                            },
                                        )}

                                    </p>

                                </div>


                                {/* GROSS */}

                                <div className="rounded-xl bg-white p-6 shadow-sm">

                                    <p className="text-sm text-gray-500">
                                        Gross Volume
                                    </p>

                                    <p className="mt-2 text-2xl font-bold text-gray-900">

                                        LKR{" "}

                                        {totalGrossVolume.toLocaleString(
                                            "en-LK",
                                            {
                                                minimumFractionDigits: 2,
                                                maximumFractionDigits: 2,
                                            },
                                        )}

                                    </p>

                                </div>


                                {/* BOOKINGS */}

                                <div className="rounded-xl bg-white p-6 shadow-sm">

                                    <p className="text-sm text-gray-500">
                                        Total Bookings
                                    </p>

                                    <p className="mt-2 text-2xl font-bold text-gray-900">
                                        {totalBookings}
                                    </p>

                                </div>


                                {/* OVERRIDE VOLUME */}

                                <div className="rounded-xl border border-purple-200 bg-purple-50 p-6">

                                    <p className="text-sm font-medium text-purple-700">
                                        Override Volume
                                    </p>

                                    <p className="mt-2 text-2xl font-bold text-purple-900">

                                        LKR{" "}

                                        {totalOverrideVolume.toLocaleString(
                                            "en-LK",
                                            {
                                                minimumFractionDigits: 2,
                                                maximumFractionDigits: 2,
                                            },
                                        )}

                                    </p>

                                </div>


                                {/* OVERRIDE COMMISSION */}

                                <div className="rounded-xl border border-purple-200 bg-purple-50 p-6">

                                    <p className="text-sm font-medium text-purple-700">
                                        Override Commission
                                    </p>

                                    <p className="mt-2 text-2xl font-bold text-purple-900">

                                        LKR{" "}

                                        {totalOverrideCommission.toLocaleString(
                                            "en-LK",
                                            {
                                                minimumFractionDigits: 2,
                                                maximumFractionDigits: 2,
                                            },
                                        )}

                                    </p>

                                </div>

                            </div>


                            {/* PAYOUT HISTORY */}

                            <div className="overflow-hidden rounded-xl bg-white shadow-sm">

                                <div className="border-b border-gray-200 px-6 py-5">

                                    <h2 className="text-lg font-semibold text-gray-900">
                                        Payout History
                                    </h2>

                                </div>


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

                                            {payouts.map(
                                                (payout) => {

                                                    const hasOverride =
                                                        Number(
                                                            payout.override_commission_amount ||
                                                            0,
                                                        ) > 0;


                                                    return (

                                                        <tr
                                                            key={`${payout.payout_run_id}-${payout.agent_code}`}
                                                            className="hover:bg-gray-50"
                                                        >

                                                            {/* RUN */}

                                                            <td className="px-6 py-4">

                                                                <p className="font-medium text-gray-900">
                                                                    #{payout.run_no}
                                                                </p>

                                                                <p className="mt-1 text-xs text-gray-500">
                                                                    {
                                                                        payout.payout_run_id
                                                                    }
                                                                </p>

                                                            </td>


                                                            {/* PERIOD */}

                                                            <td className="px-6 py-4 text-sm text-gray-600">

                                                                {new Date(
                                                                    payout.period_start,
                                                                ).toLocaleDateString()}

                                                                {" → "}

                                                                {new Date(
                                                                    payout.period_end,
                                                                ).toLocaleDateString()}

                                                            </td>


                                                            {/* BOOKINGS */}

                                                            <td className="px-6 py-4 text-sm font-medium text-gray-900">

                                                                {
                                                                    payout.booking_count
                                                                }

                                                            </td>


                                                            {/* GROSS */}

                                                            <td className="px-6 py-4 text-sm text-gray-900">

                                                                LKR{" "}

                                                                {Number(
                                                                    payout.gross_volume,
                                                                ).toLocaleString(
                                                                    "en-LK",
                                                                    {
                                                                        minimumFractionDigits: 2,
                                                                        maximumFractionDigits: 2,
                                                                    },
                                                                )}

                                                            </td>


                                                            {/* NORMAL RATE */}

                                                            <td className="px-6 py-4 text-sm text-gray-900">

                                                                {Number(
                                                                    payout.commission_rate,
                                                                ).toFixed(2)}
                                                                %

                                                            </td>


                                                            {/* OVERRIDE */}

                                                            <td className="px-6 py-4">

                                                                {hasOverride ? (

                                                                    <div className="rounded-lg border border-purple-200 bg-purple-50 p-3">

                                                                        <div className="flex items-center gap-2">

                                                                            <span className="rounded-full bg-purple-100 px-2 py-1 text-xs font-bold text-purple-700">

                                                                                OVERRIDE

                                                                            </span>

                                                                        </div>


                                                                        <p className="mt-2 text-sm font-semibold text-purple-900">

                                                                            Rate:{" "}

                                                                            {Number(
                                                                                payout.override_rate,
                                                                            ).toFixed(2)}
                                                                            %

                                                                        </p>


                                                                        <p className="mt-1 text-xs text-purple-700">

                                                                            Volume: LKR{" "}

                                                                            {Number(
                                                                                payout.override_volume,
                                                                            ).toLocaleString(
                                                                                "en-LK",
                                                                                {
                                                                                    minimumFractionDigits: 2,
                                                                                    maximumFractionDigits: 2,
                                                                                },
                                                                            )}

                                                                        </p>


                                                                        <p className="mt-1 text-xs font-semibold text-purple-800">

                                                                            Commission: LKR{" "}

                                                                            {Number(
                                                                                payout.override_commission_amount,
                                                                            ).toLocaleString(
                                                                                "en-LK",
                                                                                {
                                                                                    minimumFractionDigits: 2,
                                                                                    maximumFractionDigits: 2,
                                                                                },
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

                                                            <td className="px-6 py-4 text-sm font-semibold text-gray-900">

                                                                LKR{" "}

                                                                {Number(
                                                                    payout.commission_amount,
                                                                ).toLocaleString(
                                                                    "en-LK",
                                                                    {
                                                                        minimumFractionDigits: 2,
                                                                        maximumFractionDigits: 2,
                                                                    },
                                                                )}

                                                            </td>


                                                            {/* STATUS */}

                                                            <td className="px-6 py-4">

                                                                <span
                                                                    className={`rounded-full px-3 py-1 text-xs font-medium ${payout.payout_status ===
                                                                            "FINALISED"
                                                                            ? "bg-green-100 text-green-700"
                                                                            : "bg-yellow-100 text-yellow-700"
                                                                        }`}
                                                                >

                                                                    {
                                                                        payout.payout_status
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

                            </div>


                            {/* PROOF MESSAGE */}

                            <div className="mt-6 rounded-xl border border-purple-200 bg-purple-50 p-5">

                                <h3 className="font-semibold text-purple-900">
                                    Product Override Calculation
                                </h3>

                                <p className="mt-2 text-sm text-purple-800">

                                    When a booking matches a Product
                                    Override commission rule, the
                                    override percentage is applied
                                    instead of the normal tiered
                                    commission for that booking.

                                </p>

                                <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">

                                    <div className="rounded-lg bg-white p-4">

                                        <p className="text-xs text-gray-500">
                                            Override Volume
                                        </p>

                                        <p className="mt-1 font-bold text-gray-900">

                                            LKR{" "}

                                            {totalOverrideVolume.toLocaleString(
                                                "en-LK",
                                                {
                                                    minimumFractionDigits: 2,
                                                    maximumFractionDigits: 2,
                                                },
                                            )}

                                        </p>

                                    </div>


                                    <div className="rounded-lg bg-white p-4">

                                        <p className="text-xs text-gray-500">
                                            Override Commission
                                        </p>

                                        <p className="mt-1 font-bold text-gray-900">

                                            LKR{" "}

                                            {totalOverrideCommission.toLocaleString(
                                                "en-LK",
                                                {
                                                    minimumFractionDigits: 2,
                                                    maximumFractionDigits: 2,
                                                },
                                            )}

                                        </p>

                                    </div>


                                    <div className="rounded-lg bg-white p-4">

                                        <p className="text-xs text-gray-500">
                                            Override Applied
                                        </p>

                                        <p className="mt-1 font-bold">

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

                        </>

                    )}

            </main>

        </div>
    );
}


export default AgentPayouts;