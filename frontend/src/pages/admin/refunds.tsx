import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useAuthorizationCheck } from "../../authorization/AuthorizationCheck";
import SidebarAdmin from "../../component/layout/sidebar-admin";
import api from "../../services/api";
import { useNavigate } from "react-router-dom";

interface Refund {
    id: string;
    booking_id: string;
    amount: string;
    reason: string;
    status:
    | "PENDING"
    | "PROCESSED"
    | "CANCELLED";
    created_at: string;
}

function Refunds() {
    const { isLoading } = useAuth();

    const { adminAuthorization } =
        useAuthorizationCheck();

    const navigate = useNavigate();

    const [refunds, setRefunds] =
        useState<Refund[]>([]);

    const [loading, setLoading] =
        useState(true);

    const [error, setError] =
        useState("");

    const [deletingId, setDeletingId] =
        useState<string | null>(null);


    /*
     * Authorization
     */
    useEffect(() => {
        if (!isLoading) {
            adminAuthorization();
        }
    }, [isLoading]);


    /*
     * Load refunds
     */
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

            const response =
                await api.get(
                    "/refunds",
                    {
                        headers: {
                            Authorization:
                                `Bearer ${token}`,
                        },
                    },
                );

            setRefunds(
                response.data.data?.refunds ?? [],
            );

        } catch (err) {

            console.error(err);

            setError(
                "Unable to load refunds.",
            );

        } finally {

            setLoading(false);
        }
    }


    /*
     * Delete refund
     */
    async function handleDelete(
        refund: Refund,
    ) {

        /*
         * Do not allow deleting
         * processed refunds.
         */
        if (
            refund.status ===
            "PROCESSED"
        ) {
            alert(
                "Processed refunds cannot be deleted.",
            );

            return;
        }


        const confirmed =
            window.confirm(
                `Are you sure you want to delete refund ${refund.id}?`,
            );

        if (!confirmed) {
            return;
        }


        try {

            setDeletingId(
                refund.id,
            );


            const token =
                localStorage.getItem(
                    "token",
                );


            await api.delete(
                `/refunds/${refund.id}`,
                {
                    headers: {
                        Authorization:
                            `Bearer ${token}`,
                    },
                },
            );


            /*
             * Remove deleted refund
             * from frontend immediately.
             */
            setRefunds(
                (current) =>
                    current.filter(
                        (item) =>
                            item.id !==
                            refund.id,
                    ),
            );


        } catch (err) {

            console.error(
                "Delete refund error:",
                err,
            );

            alert(
                "Unable to delete refund.",
            );

        } finally {

            setDeletingId(null);
        }
    }


    /*
     * Navigate to create page
     */
    function handleCreateRefund() {

        navigate(
            "/createrefund",
        );
    }


    /*
     * Navigate to edit page
     */
    function handleEditRefund(
        refundId: string,
    ) {

        navigate(
            `/editrefund/${refundId}`,
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
                activeItem="Refunds"
            />


            <main className="flex-1 p-8">

                {/* Header */}
                <div className="mb-8 flex items-start justify-between">

                    <div>

                        <h1 className="text-3xl font-bold text-gray-900">
                            Refunds
                        </h1>

                        <p className="mt-2 text-gray-500">
                            Manage booking refunds here.
                        </p>

                    </div>


                    {/* Create button */}
                    <button
                        type="button"
                        onClick={
                            handleCreateRefund
                        }
                        className="rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-gray-800"
                    >
                        + Create Refund
                    </button>

                </div>


                {/* Loading */}
                {loading && (
                    <div className="rounded-lg bg-white p-6 shadow-sm">
                        Loading refunds...
                    </div>
                )}


                {/* Error */}
                {error && (
                    <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
                        {error}
                    </div>
                )}


                {/* Empty */}
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

                            <button
                                type="button"
                                onClick={
                                    handleCreateRefund
                                }
                                className="mt-5 rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-gray-800"
                            >
                                Create First Refund
                            </button>

                        </div>
                    )}


                {/* Table */}
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

                                        <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                                            Actions
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

                                                {/* Refund ID */}
                                                <td className="px-6 py-4 text-sm font-medium text-gray-900">

                                                    {refund.id}

                                                </td>


                                                {/* Booking */}
                                                <td className="px-6 py-4 text-sm text-gray-600">

                                                    {refund.booking_id}

                                                </td>


                                                {/* Amount */}
                                                <td className="px-6 py-4 text-sm font-medium text-gray-900">

                                                    {Number(
                                                        refund.amount,
                                                    ).toLocaleString(
                                                        "en-US",
                                                        {
                                                            minimumFractionDigits: 2,
                                                        },
                                                    )}

                                                </td>


                                                {/* Reason */}
                                                <td className="max-w-xs px-6 py-4 text-sm text-gray-600">

                                                    {refund.reason}

                                                </td>


                                                {/* Status */}
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


                                                {/* Created */}
                                                <td className="px-6 py-4 text-sm text-gray-500">

                                                    {new Date(
                                                        refund.created_at,
                                                    ).toLocaleDateString()}

                                                </td>


                                                {/* Actions */}
                                                <td className="px-6 py-4">

                                                    <div className="flex justify-end gap-2">

                                                        {/* Edit */}
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                handleEditRefund(
                                                                    refund.id,
                                                                )
                                                            }
                                                            disabled={
                                                                refund.status ===
                                                                "PROCESSED"
                                                            }
                                                            className="rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
                                                        >
                                                            Edit
                                                        </button>


                                                        {/* Delete */}
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                handleDelete(
                                                                    refund,
                                                                )
                                                            }
                                                            disabled={
                                                                refund.status ===
                                                                "PROCESSED" ||
                                                                deletingId ===
                                                                refund.id
                                                            }
                                                            className="rounded-md border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
                                                        >
                                                            {deletingId ===
                                                                refund.id
                                                                ? "Deleting..."
                                                                : "Delete"}
                                                        </button>

                                                    </div>

                                                </td>

                                            </tr>

                                        ),
                                    )}

                                </tbody>

                            </table>

                        </div>
                    )}

            </main>

        </div>
    );
}

export default Refunds;