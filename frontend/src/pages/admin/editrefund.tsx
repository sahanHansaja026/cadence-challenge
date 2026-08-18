import {
    useEffect,
    useState,
} from "react";

import {
    useNavigate,
    useParams,
} from "react-router-dom";

import {
    useAuth,
} from "../../context/AuthContext";

import {
    useAuthorizationCheck,
} from "../../authorization/AuthorizationCheck";

import SidebarAdmin from "../../component/layout/sidebar-admin";

import api from "../../services/api";


interface Refund {
    id: string;
    company_id: string;
    booking_id: string;
    payout_run_id: string | null;
    amount: string;
    reason: string;
    status:
    | "PENDING"
    | "PROCESSED"
    | "CANCELLED";
    created_by: string;
    created_at: string;
}


function EditRefund() {

    const {
        isLoading,
    } = useAuth();


    const {
        adminAuthorization,
    } = useAuthorizationCheck();


    const {
        id,
    } = useParams<{
        id: string;
    }>();


    const navigate =
        useNavigate();


    const [
        refund,
        setRefund,
    ] = useState<Refund | null>(
        null,
    );


    const [
        status,
        setStatus,
    ] = useState<
        "PROCESSED" | "CANCELLED"
    >("PROCESSED");


    const [
        loading,
        setLoading,
    ] = useState(true);


    const [
        saving,
        setSaving,
    ] = useState(false);


    const [
        error,
        setError,
    ] = useState("");


    const [
        success,
        setSuccess,
    ] = useState("");


    /*
     * Authorization
     */
    useEffect(() => {

        if (!isLoading) {
            adminAuthorization();
        }

    }, [
        isLoading,
    ]);


    /*
     * Load refund
     */
    useEffect(() => {

        if (
            !isLoading &&
            id
        ) {
            fetchRefund();
        }

    }, [
        isLoading,
        id,
    ]);


    async function fetchRefund() {

        try {

            setLoading(true);
            setError("");


            const token =
                localStorage.getItem(
                    "token",
                );


            const response =
                await api.get(
                    `/refunds/${id}`,
                    {
                        headers: {
                            Authorization:
                                `Bearer ${token}`,
                        },
                    },
                );


            const data =
                response.data
                    ?.data?.refund;


            if (!data) {
                throw new Error(
                    "Refund not found.",
                );
            }


            setRefund(data);


            /*
             * If current status is PENDING,
             * default to PROCESSED.
             */
            if (
                data.status ===
                "PENDING"
            ) {
                setStatus(
                    "PROCESSED",
                );
            }

        } catch (err) {

            console.error(err);

            setError(
                "Unable to load refund.",
            );

        } finally {

            setLoading(false);
        }
    }


    async function handleSubmit(
        event: React.FormEvent,
    ) {

        event.preventDefault();


        if (!id) {
            setError(
                "Refund ID is missing.",
            );

            return;
        }


        if (!refund) {
            return;
        }


        if (
            refund.status !==
            "PENDING"
        ) {

            setError(
                "This refund can no longer be edited.",
            );

            return;
        }


        try {

            setSaving(true);
            setError("");
            setSuccess("");


            const token =
                localStorage.getItem(
                    "token",
                );


            await api.patch(
                `/refunds/${id}/status`,
                {
                    status,
                },
                {
                    headers: {
                        Authorization:
                            `Bearer ${token}`,
                    },
                },
            );


            setSuccess(
                "Refund status updated successfully.",
            );


            /*
             * Reload refund after update.
             */
            await fetchRefund();


            /*
             * Go back to refund list
             * after a short delay.
             */
            setTimeout(() => {

                navigate(
                    "/refundadmin",
                );

            }, 800);


        } catch (err: any) {

            console.error(err);


            const message =
                err?.response?.data
                    ?.error?.message;


            setError(
                message ||
                "Unable to update refund.",
            );

        } finally {

            setSaving(false);
        }
    }


    if (isLoading) {

        return (
            <div className="flex min-h-screen items-center justify-center">
                Loading...
            </div>
        );
    }


    if (loading) {

        return (
            <div className="flex min-h-screen bg-gray-50">

                <SidebarAdmin
                    activeItem="Refunds"
                />

                <main className="flex-1 p-8">

                    <div className="rounded-lg bg-white p-6 shadow-sm">
                        Loading refund...
                    </div>

                </main>

            </div>
        );
    }


    return (
        <div className="flex min-h-screen bg-gray-50">

            <SidebarAdmin
                activeItem="Refunds"
            />


            <main className="flex-1 p-8">

                <div className="mb-8">

                    <button
                        type="button"
                        onClick={() =>
                            navigate(
                                "/refundadmin",
                            )
                        }
                        className="mb-4 text-sm font-medium text-gray-600 hover:text-gray-900"
                    >
                        ← Back to Refunds
                    </button>


                    <h1 className="text-3xl font-bold text-gray-900">
                        Edit Refund
                    </h1>


                    <p className="mt-2 text-gray-500">
                        Update the refund status.
                    </p>

                </div>


                {error && (

                    <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
                        {error}
                    </div>

                )}


                {success && (

                    <div className="mb-6 rounded-lg border border-green-200 bg-green-50 p-4 text-green-700">
                        {success}
                    </div>

                )}


                {refund && (

                    <div className="max-w-3xl rounded-xl bg-white p-8 shadow-sm">

                        {/* Refund ID */}

                        <div className="mb-6">

                            <label className="mb-2 block text-sm font-medium text-gray-700">
                                Refund ID
                            </label>

                            <input
                                type="text"
                                value={refund.id}
                                disabled
                                className="w-full rounded-lg border border-gray-200 bg-gray-100 px-4 py-3 text-sm text-gray-500"
                            />

                        </div>


                        {/* Booking */}

                        <div className="mb-6">

                            <label className="mb-2 block text-sm font-medium text-gray-700">
                                Booking ID
                            </label>

                            <input
                                type="text"
                                value={
                                    refund.booking_id
                                }
                                disabled
                                className="w-full rounded-lg border border-gray-200 bg-gray-100 px-4 py-3 text-sm text-gray-500"
                            />

                        </div>


                        {/* Amount */}

                        <div className="mb-6">

                            <label className="mb-2 block text-sm font-medium text-gray-700">
                                Refund Amount
                            </label>

                            <input
                                type="text"
                                value={
                                    refund.amount
                                }
                                disabled
                                className="w-full rounded-lg border border-gray-200 bg-gray-100 px-4 py-3 text-sm text-gray-500"
                            />

                        </div>


                        {/* Reason */}

                        <div className="mb-6">

                            <label className="mb-2 block text-sm font-medium text-gray-700">
                                Reason
                            </label>

                            <textarea
                                value={
                                    refund.reason
                                }
                                disabled
                                rows={4}
                                className="w-full rounded-lg border border-gray-200 bg-gray-100 px-4 py-3 text-sm text-gray-500"
                            />

                        </div>


                        {/* Current Status */}

                        <div className="mb-6">

                            <label className="mb-2 block text-sm font-medium text-gray-700">
                                Current Status
                            </label>

                            <input
                                type="text"
                                value={
                                    refund.status
                                }
                                disabled
                                className="w-full rounded-lg border border-gray-200 bg-gray-100 px-4 py-3 text-sm text-gray-500"
                            />

                        </div>


                        {refund.status ===
                            "PENDING" ? (

                            <form
                                onSubmit={
                                    handleSubmit
                                }
                            >

                                <div className="mb-8">

                                    <label className="mb-2 block text-sm font-medium text-gray-700">
                                        New Status
                                    </label>


                                    <select
                                        value={
                                            status
                                        }
                                        onChange={(event) =>
                                            setStatus(
                                                event
                                                    .target
                                                    .value as
                                                | "PROCESSED"
                                                | "CANCELLED",
                                            )
                                        }
                                        className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none focus:border-gray-900"
                                    >

                                        <option value="PROCESSED">
                                            Process Refund
                                        </option>

                                        <option value="CANCELLED">
                                            Cancel Refund
                                        </option>

                                    </select>

                                </div>


                                <div className="flex gap-3">

                                    <button
                                        type="button"
                                        onClick={() =>
                                            navigate(
                                                "/refundadmin",
                                            )
                                        }
                                        className="rounded-lg border border-gray-300 px-5 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50"
                                    >
                                        Cancel
                                    </button>


                                    <button
                                        type="submit"
                                        disabled={
                                            saving
                                        }
                                        className="rounded-lg bg-gray-900 px-5 py-3 text-sm font-medium text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
                                    >

                                        {saving
                                            ? "Saving..."
                                            : "Update Refund"}

                                    </button>

                                </div>

                            </form>

                        ) : (

                            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">

                                <p className="text-sm text-gray-600">
                                    This refund is{" "}
                                    <strong>
                                        {
                                            refund.status
                                        }
                                    </strong>
                                    {" "}and cannot be edited anymore.
                                </p>

                            </div>

                        )}

                    </div>
                )}

            </main>

        </div>
    );
}


export default EditRefund;