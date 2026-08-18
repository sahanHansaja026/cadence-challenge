import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useAuthorizationCheck } from "../../authorization/AuthorizationCheck";
import SidebarAdmin from "../../component/layout/sidebar-admin";
import SidebarFinance from "../../component/layout/sidebar-finace";
import api from "../../services/api";

interface Refund {
    id: string;
    booking_id: string;
    amount: string;
    reason: string;
    status: "PENDING" | "PROCESSED" | "CANCELLED";
    created_at: string;
}

function Refunds_finance() {
    const { isLoading } = useAuth();

    const { financeAuthorization } =
        useAuthorizationCheck();

    const [refunds, setRefunds] =
        useState<Refund[]>([]);

    const [loading, setLoading] =
        useState(true);

    const [error, setError] =
        useState("");

    useEffect(() => {
        if (!isLoading) {
            financeAuthorization();
        }
    }, [isLoading]);

    useEffect(() => {
        if (!isLoading) {
            fetchRefunds();
        }
    }, [isLoading]);

    async function fetchRefunds() {
        try {
            setLoading(true);
            setError("");

            const token =
                localStorage.getItem("token");

            const response = await api.get(
                "/refunds",
                {
                    headers: {
                        Authorization:
                            `Bearer ${token}`,
                    },
                }
            );

            setRefunds(
                response.data.data?.refunds ?? []
            );

        } catch (err) {
            console.error(err);

            setError(
                "Unable to load refunds."
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

    return (
        <div className="flex min-h-screen bg-gray-50">

            <SidebarFinance
                activeItem="Refunds"
            />

            <main className="flex-1 p-8">

                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">
                        Refunds
                    </h1>

                    <p className="mt-2 text-gray-500">
                        Manage booking refunds here.
                    </p>
                </div>

                {loading && (
                    <div className="rounded-lg bg-white p-6 shadow-sm">
                        Loading refunds...
                    </div>
                )}

                {error && (
                    <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
                        {error}
                    </div>
                )}

                {!loading &&
                    !error &&
                    refunds.length === 0 && (
                        <div className="rounded-lg bg-white p-8 text-center shadow-sm">
                            <h2 className="text-lg font-semibold text-gray-900">
                                No refunds found
                            </h2>

                            <p className="mt-2 text-sm text-gray-500">
                                There are currently no refunds
                                for your company.
                            </p>
                        </div>
                    )}

                {!loading &&
                    !error &&
                    refunds.length > 0 && (
                        <div className="overflow-hidden rounded-lg bg-white shadow-sm">

                            <table className="w-full">

                                <thead className="border-b border-gray-200 bg-gray-50">

                                    <tr>

                                        <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                                            Refund ID
                                        </th>

                                        <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                                            Booking
                                        </th>

                                        <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                                            Amount
                                        </th>

                                        <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                                            Reason
                                        </th>

                                        <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                                            Status
                                        </th>

                                        <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                                            Created
                                        </th>

                                    </tr>

                                </thead>

                                <tbody className="divide-y divide-gray-200">

                                    {refunds.map(
                                        (refund) => (
                                            <tr
                                                key={
                                                    refund.id
                                                }
                                                className="hover:bg-gray-50"
                                            >

                                                <td className="px-6 py-4 text-sm font-medium text-gray-900">
                                                    {refund.id}
                                                </td>

                                                <td className="px-6 py-4 text-sm text-gray-600">
                                                    {refund.booking_id}
                                                </td>

                                                <td className="px-6 py-4 text-sm font-medium text-gray-900">
                                                    {refund.amount}
                                                </td>

                                                <td className="max-w-xs px-6 py-4 text-sm text-gray-600">
                                                    {refund.reason}
                                                </td>

                                                <td className="px-6 py-4">
                                                    <span
                                                        className={`rounded-full px-3 py-1 text-xs font-medium ${refund.status ===
                                                            "PENDING"
                                                            ? "bg-yellow-100 text-yellow-700"
                                                            : refund.status ===
                                                                "PROCESSED"
                                                                ? "bg-green-100 text-green-700"
                                                                : "bg-red-100 text-red-700"
                                                            }`}
                                                    >
                                                        {
                                                            refund.status
                                                        }
                                                    </span>
                                                </td>

                                                <td className="px-6 py-4 text-sm text-gray-500">
                                                    {new Date(
                                                        refund.created_at
                                                    ).toLocaleDateString()}
                                                </td>

                                            </tr>
                                        )
                                    )}

                                </tbody>

                            </table>

                        </div>
                    )}

            </main>

        </div>
    );
}

export default Refunds_finance;