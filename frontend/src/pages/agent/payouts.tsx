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
    payout_status: "DRAFT" | "FINALISED";
    agent_code: string;
    booking_count: number;
    gross_volume: string;
    commission_rate: string;
    commission_amount: string;
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


    useEffect(() => {

        if (!isLoading) {

            agentAuthorization();

        }

    }, [isLoading]);


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
             * The Axios interceptor automatically
             * adds the JWT Authorization header.
             *
             * We do NOT send:
             *
             * agentCode
             * userId
             * companyId
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


    if (isLoading) {

        return (
            <div className="flex min-h-screen items-center justify-center">
                Loading...
            </div>
        );

    }


    /*
     * Calculate total commission.
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


    /*
     * Calculate total gross volume.
     */
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


    /*
     * Calculate total bookings.
     */
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


    return (
        <div className="flex min-h-screen bg-gray-50">

            <SidebarAgent
                activeItem="My Payout Statements"
            />


            <main className="flex-1 p-8">

                {/* Header */}

                <div className="mb-8">

                    <h1 className="text-3xl font-bold text-gray-900">
                        My Payouts
                    </h1>

                    <p className="mt-2 text-gray-500">
                        View your payout runs and commission earnings.
                    </p>

                </div>


                {/* Agent Information */}

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

                            <p className="mt-1 font-medium text-blue-900 break-all">
                                {user?.companyId ?? "Unknown"}
                            </p>

                        </div>

                    </div>

                </div>


                {/* Loading */}

                {loading && (

                    <div className="rounded-xl bg-white p-8 text-center shadow-sm">

                        <p className="text-gray-500">
                            Loading your payouts...
                        </p>

                    </div>

                )}


                {/* Error */}

                {!loading && error && (

                    <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-red-700">

                        {error}

                    </div>

                )}


                {/* No payouts */}

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


                {/* Payouts */}

                {!loading &&
                    !error &&
                    payouts.length > 0 && (

                        <>

                            {/* Summary Cards */}

                            <div className="mb-6 grid grid-cols-1 gap-5 md:grid-cols-3">

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


                                <div className="rounded-xl bg-white p-6 shadow-sm">

                                    <p className="text-sm text-gray-500">
                                        Total Bookings
                                    </p>

                                    <p className="mt-2 text-2xl font-bold text-gray-900">
                                        {totalBookings}
                                    </p>

                                </div>

                            </div>


                            {/* Payout Table */}

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

                                            {payouts.map(
                                                (payout) => (

                                                    <tr
                                                        key={`${payout.payout_run_id}-${payout.agent_code}`}
                                                        className="hover:bg-gray-50"
                                                    >

                                                        <td className="px-6 py-4">

                                                            <p className="font-medium text-gray-900">
                                                                #{payout.run_no}
                                                            </p>

                                                            <p className="mt-1 text-xs text-gray-500">
                                                                {payout.payout_run_id}
                                                            </p>

                                                        </td>


                                                        <td className="px-6 py-4 text-sm text-gray-600">

                                                            {new Date(
                                                                payout.period_start,
                                                            ).toLocaleDateString()}

                                                            {" → "}

                                                            {new Date(
                                                                payout.period_end,
                                                            ).toLocaleDateString()}

                                                        </td>


                                                        <td className="px-6 py-4 text-sm font-medium text-gray-900">

                                                            {payout.booking_count}

                                                        </td>


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


                                                        <td className="px-6 py-4 text-sm text-gray-900">

                                                            {Number(
                                                                payout.commission_rate,
                                                            ).toFixed(2)}
                                                            %

                                                        </td>


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

                                                ),
                                            )}

                                        </tbody>

                                    </table>

                                </div>

                            </div>

                        </>

                    )}

            </main>

        </div>
    );
}


export default AgentPayouts;