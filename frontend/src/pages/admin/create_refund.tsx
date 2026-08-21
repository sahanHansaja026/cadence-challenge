import {
    useEffect,
    useState,
} from "react";

import type {
    FormEvent,
} from "react";

import {
    useNavigate,
} from "react-router-dom";

import { useAuth } from "../../context/AuthContext";

import {
    useAuthorizationCheck,
} from "../../authorization/AuthorizationCheck";

import SidebarAdmin from "../../component/layout/sidebar-admin";

import api from "../../services/api";


interface Booking {
    id: string;
    agent_code: string;
    product_code: string;
    amount: string;
    booking_date: string;
    status: string;
}


function CreateRefund() {

    const { isLoading } =
        useAuth();

    const {
        adminAuthorization,
    } = useAuthorizationCheck();

    const navigate =
        useNavigate();


    const [bookings, setBookings] =
        useState<Booking[]>([]);

    const [bookingId, setBookingId] =
        useState("");

    const [amount, setAmount] =
        useState("");

    const [reason, setReason] =
        useState("");

    const [loadingBookings, setLoadingBookings] =
        useState(true);

    const [saving, setSaving] =
        useState(false);

    const [error, setError] =
        useState("");


    /*
     * ADMIN AUTHORIZATION
     */
    useEffect(() => {

        if (!isLoading) {
            adminAuthorization();
        }

    }, [isLoading]);


    /*
     * LOAD BOOKINGS
     */
    useEffect(() => {

        if (!isLoading) {
            fetchBookings();
        }

    }, [isLoading]);


    async function fetchBookings() {

        try {

            setLoadingBookings(true);

            setError("");

            const token =
                localStorage.getItem(
                    "token",
                );


            const response =
                await api.get(
                    "/bookings",
                    {
                        headers: {
                            Authorization:
                                `Bearer ${token}`,
                        },
                    },
                );


            /*
             * Your bookings API is expected
             * to return:
             *
             * data.data.bookings
             */
            setBookings(
                response.data.data?.bookings ??
                [],
            );

        } catch (err) {

            console.error(
                "Fetch bookings error:",
                err,
            );

            setError(
                "Unable to load bookings.",
            );

        } finally {

            setLoadingBookings(false);
        }
    }


    /*
     * SELECTED BOOKING
     */
    const selectedBooking =
        bookings.find(
            (booking) =>
                booking.id === bookingId,
        );


    /*
     * CREATE REFUND
     */
    async function handleSubmit(
        event: FormEvent<HTMLFormElement>,
    ) {

        event.preventDefault();

        setError("");


        /*
         * Validate booking.
         */
        if (!bookingId) {

            setError(
                "Please select a booking.",
            );

            return;
        }


        /*
         * Validate amount.
         */
        const refundAmount =
            Number(amount);


        if (
            !amount ||
            !Number.isFinite(
                refundAmount,
            ) ||
            refundAmount <= 0
        ) {

            setError(
                "Please enter a valid refund amount.",
            );

            return;
        }


        /*
         * Prevent refund greater than
         * original booking amount.
         */
        if (
            selectedBooking &&
            refundAmount >
            Number(
                selectedBooking.amount,
            )
        ) {

            setError(
                "Refund amount cannot be greater than the booking amount.",
            );

            return;
        }


        /*
         * Validate reason.
         */
        if (!reason.trim()) {

            setError(
                "Please enter a refund reason.",
            );

            return;
        }


        try {

            setSaving(true);


            const token =
                localStorage.getItem(
                    "token",
                );


            /*
             * Backend:
             *
             * POST /api/refunds
             */
            await api.post(
                "/refunds",
                {
                    bookingId:
                        bookingId,

                    amount:
                        amount,

                    reason:
                        reason.trim(),
                },
                {
                    headers: {
                        Authorization:
                            `Bearer ${token}`,
                    },
                },
            );


            /*
             * Successfully created.
             *
             * Go back to refund list.
             */
            navigate(
                "/refundadmin",
            );

        } catch (err: any) {

            console.error(
                "Create refund error:",
                err,
            );


            const backendMessage =
                err?.response?.data?.error
                    ?.message;


            setError(
                backendMessage ??
                "Unable to create refund.",
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


    return (
        <div className="flex min-h-screen bg-gray-50">

            {/* SIDEBAR */}

            <SidebarAdmin
                activeItem="Refunds"
            />


            {/* MAIN */}

            <main className="flex-1 p-8">

                {/* HEADER */}

                <div className="mb-8">

                    <h1 className="text-3xl font-bold text-gray-900">
                        Create Refund
                    </h1>

                    <p className="mt-2 text-gray-500">
                        Create a refund against a booking.
                    </p>

                </div>


                {/* FORM CARD */}

                <div className="max-w-2xl rounded-xl bg-white p-8 shadow-sm">

                    {/* ERROR */}

                    {error && (

                        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">

                            {error}

                        </div>

                    )}


                    <form
                        onSubmit={
                            handleSubmit
                        }
                        className="space-y-6"
                    >

                        {/* BOOKING */}

                        <div>

                            <label
                                htmlFor="booking"
                                className="mb-2 block text-sm font-medium text-gray-700"
                            >
                                Booking
                            </label>


                            <select
                                id="booking"
                                value={
                                    bookingId
                                }
                                onChange={(event) =>
                                    setBookingId(
                                        event.target.value,
                                    )
                                }
                                disabled={
                                    loadingBookings ||
                                    saving
                                }
                                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
                            >

                                <option value="">
                                    {loadingBookings
                                        ? "Loading bookings..."
                                        : "Select a booking"}
                                </option>


                                {bookings.map(
                                    (booking) => (

                                        <option
                                            key={
                                                booking.id
                                            }
                                            value={
                                                booking.id
                                            }
                                        >
                                            {booking.id} —{" "}
                                            {booking.agent_code} —{" "}
                                            {booking.product_code} —{" "}
                                            {Number(
                                                booking.amount,
                                            ).toLocaleString(
                                                "en-US",
                                                {
                                                    minimumFractionDigits: 2,
                                                },
                                            )}
                                        </option>

                                    ),
                                )}

                            </select>

                        </div>


                        {/* SELECTED BOOKING INFO */}

                        {selectedBooking && (

                            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">

                                <h3 className="mb-3 text-sm font-semibold text-gray-900">
                                    Booking Information
                                </h3>


                                <div className="grid grid-cols-2 gap-4 text-sm">

                                    <div>

                                        <p className="text-gray-500">
                                            Agent
                                        </p>

                                        <p className="mt-1 font-medium text-gray-900">
                                            {
                                                selectedBooking.agent_code
                                            }
                                        </p>

                                    </div>


                                    <div>

                                        <p className="text-gray-500">
                                            Product
                                        </p>

                                        <p className="mt-1 font-medium text-gray-900">
                                            {
                                                selectedBooking.product_code
                                            }
                                        </p>

                                    </div>


                                    <div>

                                        <p className="text-gray-500">
                                            Booking Amount
                                        </p>

                                        <p className="mt-1 font-medium text-gray-900">
                                            {Number(
                                                selectedBooking.amount,
                                            ).toLocaleString(
                                                "en-US",
                                                {
                                                    minimumFractionDigits: 2,
                                                },
                                            )}
                                        </p>

                                    </div>


                                    <div>

                                        <p className="text-gray-500">
                                            Booking Date
                                        </p>

                                        <p className="mt-1 font-medium text-gray-900">
                                            {
                                                selectedBooking.booking_date
                                            }
                                        </p>

                                    </div>

                                </div>

                            </div>

                        )}


                        {/* REFUND AMOUNT */}

                        <div>

                            <label
                                htmlFor="amount"
                                className="mb-2 block text-sm font-medium text-gray-700"
                            >
                                Refund Amount
                            </label>


                            <input
                                id="amount"
                                type="number"
                                min="0.01"
                                step="0.01"
                                value={
                                    amount
                                }
                                onChange={(event) =>
                                    setAmount(
                                        event.target.value,
                                    )
                                }
                                disabled={
                                    saving
                                }
                                placeholder="5000.00"
                                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
                            />


                            {selectedBooking && (

                                <p className="mt-2 text-xs text-gray-500">
                                    Maximum refund:
                                    {" "}
                                    {Number(
                                        selectedBooking.amount,
                                    ).toLocaleString(
                                        "en-US",
                                        {
                                            minimumFractionDigits: 2,
                                        },
                                    )}
                                </p>

                            )}

                        </div>


                        {/* REASON */}

                        <div>

                            <label
                                htmlFor="reason"
                                className="mb-2 block text-sm font-medium text-gray-700"
                            >
                                Refund Reason
                            </label>


                            <textarea
                                id="reason"
                                value={
                                    reason
                                }
                                onChange={(event) =>
                                    setReason(
                                        event.target.value,
                                    )
                                }
                                disabled={
                                    saving
                                }
                                rows={4}
                                maxLength={500}
                                placeholder="Customer cancellation"
                                className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
                            />


                            <p className="mt-2 text-xs text-gray-400">
                                {reason.length}/500
                            </p>

                        </div>


                        {/* STATUS INFORMATION */}

                        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">

                            <p className="text-sm font-medium text-yellow-800">
                                Refund status
                            </p>

                            <p className="mt-1 text-sm text-yellow-700">
                                New refunds will be created
                                with PENDING status.
                            </p>

                        </div>


                        {/* BUTTONS */}

                        <div className="flex justify-end gap-3 border-t border-gray-200 pt-6">

                            <button
                                type="button"
                                onClick={() =>
                                    navigate(
                                        "/admin/refunds",
                                    )
                                }
                                disabled={
                                    saving
                                }
                                className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                Cancel
                            </button>


                            <button
                                type="submit"
                                disabled={
                                    saving ||
                                    loadingBookings
                                }
                                className="rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {saving
                                    ? "Creating..."
                                    : "Create Refund"}
                            </button>

                        </div>

                    </form>

                </div>

            </main>

        </div>
    );
}


export default CreateRefund;