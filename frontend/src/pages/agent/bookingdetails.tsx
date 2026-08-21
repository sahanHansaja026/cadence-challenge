import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useAuthorizationCheck } from "../../authorization/AuthorizationCheck";
import SidebarAdmin from "../../component/layout/sidebar-admin";
import api from "../../services/api";

interface Booking {
    id: string;
    agent_code: string;
    external_ref: string;
    product_code: string;
    amount: string;
    booking_date: string;
    status: string;
    company_id: string;
}

function ViewBookings_agents() {
    const { isLoading } = useAuth();

    const {
        agentAuthorization,
    } = useAuthorizationCheck();

    const [bookings, setBookings] =
        useState<Booking[]>([]);

    const [loadingBookings, setLoadingBookings] =
        useState(false);

    const [error, setError] =
        useState("");

    // Agent authorization
    useEffect(() => {
        if (!isLoading) {
            agentAuthorization();
        }
    }, [isLoading]);

    // Get bookings
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

            const response = await api.get(
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

    if (isLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <p className="text-sm text-gray-500">
                    Loading...
                </p>
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
            <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">

                {/* Header */}
                <div className="mb-6 sm:mb-8">

                    <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
                        My Bookings
                    </h1>

                    <p className="mt-2 text-sm text-gray-500">
                        View your sales bookings and
                        booking details.
                    </p>

                </div>

                {/* Error */}
                {error && (
                    <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
                        {error}
                    </div>
                )}

                {/* Table Card */}
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

                        /*
                         * Responsive table:
                         * Horizontal scrolling is enabled
                         * on small screens.
                         */
                        <div className="w-full overflow-x-auto">

                            <table className="min-w-[1000px] w-full text-left">

                                <thead className="border-b border-gray-200 bg-gray-50">

                                    <tr>

                                        <th className="whitespace-nowrap px-4 py-4 text-xs font-semibold uppercase tracking-wide text-gray-500 sm:px-6">
                                            Booking ID
                                        </th>

                                        <th className="whitespace-nowrap px-4 py-4 text-xs font-semibold uppercase tracking-wide text-gray-500 sm:px-6">
                                            Agent ID
                                        </th>

                                        <th className="whitespace-nowrap px-4 py-4 text-xs font-semibold uppercase tracking-wide text-gray-500 sm:px-6">
                                                    external_ref
                                        </th>

                                        <th className="whitespace-nowrap px-4 py-4 text-xs font-semibold uppercase tracking-wide text-gray-500 sm:px-6">
                                            Product
                                        </th>

                                        <th className="whitespace-nowrap px-4 py-4 text-xs font-semibold uppercase tracking-wide text-gray-500 sm:px-6">
                                            Amount
                                        </th>

                                        <th className="whitespace-nowrap px-4 py-4 text-xs font-semibold uppercase tracking-wide text-gray-500 sm:px-6">
                                            Booking Date
                                        </th>

                                        <th className="whitespace-nowrap px-4 py-4 text-xs font-semibold uppercase tracking-wide text-gray-500 sm:px-6">
                                            Status
                                        </th>

                                        <th className="whitespace-nowrap px-4 py-4 text-xs font-semibold uppercase tracking-wide text-gray-500 sm:px-6">
                                            Company
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
                                                className="transition hover:bg-gray-50"
                                            >

                                                {/* Booking ID */}
                                                <td className="whitespace-nowrap px-4 py-4 text-sm font-medium text-gray-900 sm:px-6">
                                                    {
                                                        booking.id
                                                    }
                                                </td>

                                                {/* Agent ID */}
                                                <td className="whitespace-nowrap px-4 py-4 text-sm text-gray-700 sm:px-6">
                                                    {
                                                        booking.agent_code
                                                    }
                                                </td>

                                                {/* Customer */}
                                                <td className="whitespace-nowrap px-4 py-4 text-sm text-gray-700 sm:px-6">
                                                    {
                                                        booking.external_ref
                                                    }
                                                </td>

                                                {/* Product */}
                                                <td className="whitespace-nowrap px-4 py-4 text-sm text-gray-700 sm:px-6">
                                                    {
                                                        booking.product_code
                                                    }
                                                </td>

                                                {/* Amount */}
                                                <td className="whitespace-nowrap px-4 py-4 text-sm font-medium text-gray-900 sm:px-6">
                                                    {
                                                        booking.amount
                                                    }
                                                </td>

                                                {/* Booking Date */}
                                                <td className="whitespace-nowrap px-4 py-4 text-sm text-gray-500 sm:px-6">
                                                    {new Date(
                                                        booking.booking_date
                                                    ).toLocaleDateString()}
                                                </td>

                                                {/* Status */}
                                                <td className="whitespace-nowrap px-4 py-4 sm:px-6">

                                                    <span className="inline-flex rounded-md bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700">
                                                        {
                                                            booking.status
                                                        }
                                                    </span>

                                                </td>

                                                {/* Company */}
                                                <td className="whitespace-nowrap px-4 py-4 text-sm text-gray-500 sm:px-6">
                                                    {
                                                        booking.company_id
                                                    }
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

export default ViewBookings_agents;