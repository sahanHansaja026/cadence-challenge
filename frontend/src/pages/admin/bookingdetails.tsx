import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useAuthorizationCheck } from "../../authorization/AuthorizationCheck";
import SidebarAdmin from "../../component/layout/sidebar-admin";
import Button from "../../component/ui/Button";
import api from "../../services/api";
import { useNavigate } from "react-router-dom";

interface Booking {
    id: string;
    agent_code: string;
    customer_name: string;
    product_code: string;
    amount: string;
    currency: string;
    booking_date: string;
    status: string;
    company_id: string;
}

function ViewBookings() {
    const { user, isLoading } = useAuth();
    const navigate = useNavigate();

    const {
        adminAuthorization,
    } = useAuthorizationCheck();

    const [bookings, setBookings] =
        useState<Booking[]>([]);

    const [loadingBookings, setLoadingBookings] =
        useState(false);

    const [error, setError] =
        useState("");

    /*
     * Admin authorization
     */
    useEffect(() => {
        if (!isLoading) {
            adminAuthorization();
        }
    }, [isLoading]);

    /*
     * Get bookings
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
                    },
                );

            setBookings(
                response.data.data.bookings,
            );

        } catch (error: unknown) {

            console.error(
                "Fetch bookings error:",
                error,
            );

            const axiosError =
                error as {
                    response?: {
                        data?: {
                            error?: {
                                message?: string;
                            };
                        };
                    };
                };

            setError(
                axiosError.response?.data?.error
                    ?.message ||
                "Failed to load bookings.",
            );

        } finally {
            setLoadingBookings(false);
        }
    };

    /*
     * Edit booking
     */
    const handleEdit = (
        bookingId: string,
    ) => {
        navigate(
            `/editbooking/${bookingId}`,
        );
    };

    /*
     * Reject booking
     *
     * This does NOT delete the booking.
     *
     * Backend:
     *
     * POST /api/bookings/:id/reject
     *
     * The booking remains in the database
     * with status = REJECTED.
     */
    const handleReject = async (
        bookingId: string,
    ) => {

        const confirmed =
            window.confirm(
                "Are you sure you want to reject this booking?",
            );

        if (!confirmed) {
            return;
        }

        try {

            const token =
                localStorage.getItem("token");

            const response =
                await api.post(
                    `/bookings/${bookingId}/reject`,
                    {},
                    {
                        headers: {
                            Authorization:
                                `Bearer ${token}`,
                        },
                    },
                );

            /*
             * Get the updated booking returned
             * by the backend.
             */
            const updatedBooking =
                response.data.data.booking;

            /*
             * Update only this booking
             * in the current table.
             */
            setBookings(
                (currentBookings) =>
                    currentBookings.map(
                        (booking) =>
                            booking.id === bookingId
                                ? updatedBooking
                                : booking,
                    ),
            );

        } catch (error: unknown) {

            console.error(
                "Reject booking error:",
                error,
            );

            const axiosError =
                error as {
                    response?: {
                        data?: {
                            error?: {
                                message?: string;
                            };
                        };
                    };
                };

            setError(
                axiosError.response?.data?.error
                    ?.message ||
                "Failed to reject booking.",
            );
        }
    };

    if (isLoading) {
        return (
            <div>
                Loading...
            </div>
        );
    }

    return (
        <div className="flex min-h-screen bg-gray-50">

            {/* Sidebar */}
            <SidebarAdmin
                activeItem="Booking Details"
            />

            {/* Main */}
            <main className="flex-1 p-8">

                {/* Header */}
                <div className="mb-8">

                    <h1 className="text-3xl font-bold text-gray-900">
                        Bookings
                    </h1>

                    <p className="mt-2 text-sm text-gray-500">
                        View and manage bookings
                        in your company.
                    </p>

                </div>

                {/* Error */}
                {error && (
                    <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
                        {error}
                    </div>
                )}

                {/* Table */}
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
                                            Amount
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

                                <tbody className="divide-y divide-gray-200">

                                    {bookings.map(
                                        (booking) => (

                                            <tr
                                                key={
                                                    booking.id
                                                }
                                                className="hover:bg-gray-50"
                                            >

                                                <td className="px-6 py-4 text-sm font-medium text-gray-900">
                                                    {
                                                        booking.id
                                                    }
                                                </td>

                                                <td className="px-6 py-4 text-sm text-gray-700">
                                                    {
                                                        booking.agent_code
                                                    }
                                                </td>

                                                <td className="px-6 py-4 text-sm text-gray-700">
                                                    {
                                                        booking.product_code
                                                    }
                                                </td>

                                                <td className="px-6 py-4 text-sm font-medium text-gray-900">
                                                    {
                                                        booking.currency
                                                    }{" "}
                                                    {
                                                        booking.amount
                                                    }
                                                </td>

                                                <td className="px-6 py-4 text-sm text-gray-500">
                                                    {
                                                        new Date(
                                                            booking.booking_date,
                                                        ).toLocaleDateString()
                                                    }
                                                </td>

                                                <td className="px-6 py-4">

                                                    <span
                                                        className={
                                                            booking.status ===
                                                                "REJECTED"
                                                                ? "rounded-md bg-red-100 px-2.5 py-1 text-xs font-medium text-red-700"
                                                                : "rounded-md bg-green-100 px-2.5 py-1 text-xs font-medium text-green-700"
                                                        }
                                                    >
                                                        {
                                                            booking.status
                                                        }
                                                    </span>

                                                </td>

                                                <td className="px-6 py-4">

                                                    {user?.role === "AGENT" ? (

                                                        <span className="text-sm text-gray-400">
                                                            View only
                                                        </span>

                                                    ) : (

                                                        <div className="flex gap-2">

                                                            <Button
                                                                type="button"
                                                                variant="secondary"
                                                                onClick={() =>
                                                                    handleEdit(
                                                                        booking.id,
                                                                    )
                                                                }
                                                                disabled={
                                                                    booking.status ===
                                                                    "REJECTED"
                                                                }
                                                            >
                                                                Edit
                                                            </Button>

                                                            <Button
                                                                type="button"
                                                                variant="danger"
                                                                onClick={() =>
                                                                    handleReject(
                                                                        booking.id,
                                                                    )
                                                                }
                                                                disabled={
                                                                    booking.status ===
                                                                    "REJECTED"
                                                                }
                                                            >
                                                                Reject
                                                            </Button>

                                                        </div>

                                                    )}

                                                </td>

                                            </tr>

                                        ),
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

export default ViewBookings;