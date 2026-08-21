import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useAuthorizationCheck } from "../../authorization/AuthorizationCheck";

import Button from "../../component/ui/Button";
import api from "../../services/api";
import { useNavigate } from "react-router-dom";
import SidebarFinance from "../../component/layout/sidebar-finace";


interface Booking {
    id: string;

    company_id: string;

    external_ref: string;

    agent_code: string;

    product_code: string;

    booking_date: string;

    original_amount: string | null;

    original_currency: string | null;

    exchange_rate: string | null;

    amount: string;

    currency: string;

    status: string;
}


function View_Bookings_finace() {

    const {
        user,
        isLoading,
    } = useAuth();

    const navigate =
        useNavigate();

    const {
        financeAuthorization,
    } = useAuthorizationCheck();


    const [bookings, setBookings] =
        useState<Booking[]>([]);

    const [loadingBookings, setLoadingBookings] =
        useState(false);

    const [error, setError] =
        useState("");


    /*
     * =====================================================
     * FINANCE AUTHORIZATION
     * =====================================================
     */

    useEffect(() => {

        if (!isLoading) {
            financeAuthorization();
        }

    }, [
        isLoading,
        financeAuthorization,
    ]);


    /*
     * =====================================================
     * GET BOOKINGS
     * =====================================================
     */

    useEffect(() => {

        if (!isLoading) {
            fetchBookings();
        }

    }, [isLoading]);


    const fetchBookings = async () => {

        try {

            setLoadingBookings(true);

            setError("");


            const token =
                localStorage.getItem("token");


            const response =
                await api.get(
                    "/bookings",
                    {
                        headers: {
                            Authorization:
                                `Bearer ${token}`,
                        },
                    }
                );


            setBookings(
                response.data.data.bookings
            );

        } catch (error: any) {

            console.error(
                "Fetch bookings error:",
                error
            );


            setError(
                error?.response?.data?.error
                    ?.message ||
                "Failed to load bookings."
            );

        } finally {

            setLoadingBookings(false);

        }

    };


    /*
     * =====================================================
     * EDIT BOOKING
     * =====================================================
     */

    const handleEdit = (
        bookingId: string
    ) => {

        navigate(
            `/editbooking_finace/${bookingId}`
        );

    };


    /*
     * =====================================================
     * REJECT BOOKING
     * =====================================================
     */

    const handleReject = async (
        bookingId: string
    ) => {

        const confirmed =
            window.confirm(
                "Are you sure you want to reject this booking?"
            );


        if (!confirmed) {
            return;
        }


        try {

            const token =
                localStorage.getItem("token");


            await api.post(
                `/bookings/${bookingId}/reject`,
                {},
                {
                    headers: {
                        Authorization:
                            `Bearer ${token}`,
                    },
                }
            );


            /*
             * Update the booking locally
             * instead of deleting it.
             */

            setBookings(
                (currentBookings) =>
                    currentBookings.map(
                        (booking) =>
                            booking.id === bookingId
                                ? {
                                    ...booking,
                                    status: "REJECTED",
                                }
                                : booking
                    )
            );


        } catch (error: any) {

            console.error(
                "Reject booking error:",
                error
            );


            setError(
                error?.response?.data?.error
                    ?.message ||
                "Failed to reject booking."
            );

        }

    };


    /*
     * =====================================================
     * LOADING AUTH
     * =====================================================
     */

    if (isLoading) {

        return (
            <div>
                Loading...
            </div>
        );

    }


    /*
     * =====================================================
     * PAGE
     * =====================================================
     */

    return (

        <div className="flex min-h-screen bg-gray-50">


            {/* =================================================
                SIDEBAR
            ================================================= */}

            <SidebarFinance
                activeItem="Booking View"
            />


            {/* =================================================
                MAIN
            ================================================= */}

            <main className="flex-1 p-8">


                {/* =================================================
                    HEADER
                ================================================= */}

                <div className="mb-8">

                    <h1 className="text-3xl font-bold text-gray-900">
                        Bookings
                    </h1>

                    <p className="mt-2 text-sm text-gray-500">
                        View and manage bookings
                        in your company.
                    </p>

                </div>


                {/* =================================================
                    ERROR
                ================================================= */}

                {error && (

                    <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">

                        {error}

                    </div>

                )}


                {/* =================================================
                    TABLE
                ================================================= */}

                <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">


                    {loadingBookings ? (

                        <div className="p-6 text-sm text-gray-500">

                            Loading bookings...

                        </div>


                    ) : bookings.length === 0 ? (

                        <div className="p-6 text-sm text-gray-500">

                            No bookings found.

                        </div>


                    ) : (

                        <div className="overflow-x-auto">

                            <table className="w-full text-left">


                                {/* =================================================
                                    TABLE HEADER
                                ================================================= */}

                                <thead className="border-b border-gray-200 bg-gray-50">

                                    <tr>


                                        <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-gray-500">
                                            Booking ID
                                        </th>


                                        <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-gray-500">
                                            Agent
                                        </th>


                                        <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-gray-500">
                                            Product
                                        </th>


                                        <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-gray-500">
                                            Original Amount
                                        </th>


                                        <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-gray-500">
                                            LKR Amount
                                        </th>


                                        <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-gray-500">
                                            Exchange Rate
                                        </th>


                                        <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-gray-500">
                                            Booking Date
                                        </th>


                                        <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-gray-500">
                                            Status
                                        </th>


                                        <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-gray-500">
                                            Actions
                                        </th>


                                    </tr>

                                </thead>


                                {/* =================================================
                                    TABLE BODY
                                ================================================= */}

                                <tbody className="divide-y divide-gray-200">


                                    {bookings.map(
                                        (booking) => (

                                            <tr
                                                key={
                                                    booking.id
                                                }
                                                className="hover:bg-gray-50"
                                            >


                                                {/* =================================================
                                                    BOOKING ID
                                                ================================================= */}

                                                <td className="px-6 py-4 text-sm font-medium text-gray-900">

                                                    {booking.id}

                                                </td>


                                                {/* =================================================
                                                    AGENT
                                                ================================================= */}

                                                <td className="px-6 py-4 text-sm text-gray-700">

                                                    {booking.agent_code}

                                                </td>


                                                {/* =================================================
                                                    PRODUCT
                                                ================================================= */}

                                                <td className="px-6 py-4 text-sm text-gray-700">

                                                    {booking.product_code}

                                                </td>


                                                {/* =================================================
                                                    ORIGINAL AMOUNT
                                                ================================================= */}

                                                <td className="px-6 py-4 text-sm font-medium text-gray-900">

                                                    {booking.original_currency ?? "LKR"}{" "}

                                                    {Number(
                                                        booking.original_amount ??
                                                        booking.amount
                                                    ).toFixed(2)}

                                                </td>


                                                {/* =================================================
                                                    LKR AMOUNT
                                                ================================================= */}

                                                <td className="px-6 py-4 text-sm font-medium text-gray-900">

                                                    {booking.currency}{" "}

                                                    {Number(
                                                        booking.amount
                                                    ).toFixed(2)}

                                                </td>


                                                {/* =================================================
                                                    EXCHANGE RATE
                                                ================================================= */}

                                                <td className="px-6 py-4 text-sm text-gray-700">

                                                    {Number(
                                                        booking.exchange_rate ?? "1"
                                                    ).toFixed(6)}

                                                </td>


                                                {/* =================================================
                                                    BOOKING DATE
                                                ================================================= */}

                                                <td className="px-6 py-4 text-sm text-gray-500">

                                                    {new Date(
                                                        booking.booking_date
                                                    ).toLocaleDateString()}

                                                </td>


                                                {/* =================================================
                                                    STATUS
                                                ================================================= */}

                                                <td className="px-6 py-4">

                                                    <span
                                                        className={
                                                            booking.status === "ACTIVE"
                                                                ? "rounded-md bg-green-100 px-2.5 py-1 text-xs font-medium text-green-700"
                                                                : "rounded-md bg-red-100 px-2.5 py-1 text-xs font-medium text-red-700"
                                                        }
                                                    >

                                                        {booking.status}

                                                    </span>

                                                </td>


                                                {/* =================================================
                                                    ACTIONS
                                                ================================================= */}

                                                <td className="px-6 py-4">

                                                    {booking.status === "REJECTED" ? (

                                                        <span className="text-sm text-gray-400">
                                                            Rejected
                                                        </span>

                                                    ) : (

                                                        <div className="flex gap-2">


                                                            <Button
                                                                type="button"
                                                                variant="secondary"
                                                                onClick={() =>
                                                                    handleEdit(
                                                                        booking.id
                                                                    )
                                                                }
                                                            >
                                                                Edit
                                                            </Button>


                                                            <Button
                                                                type="button"
                                                                variant="danger"
                                                                onClick={() =>
                                                                    handleReject(
                                                                        booking.id
                                                                    )
                                                                }
                                                            >
                                                                Reject
                                                            </Button>


                                                        </div>

                                                    )}

                                                </td>


                                            </tr>

                                        )
                                    )}

                                </tbody>

                            </table>

                        </div>

                    )}

                </div>

            </main>

        </div>

    );

}


export default View_Bookings_finace;