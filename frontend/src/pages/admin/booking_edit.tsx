import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useAuthorizationCheck } from "../../authorization/AuthorizationCheck";
import SidebarAdmin from "../../component/layout/sidebar-admin";
import Button from "../../component/ui/Button";
import api from "../../services/api";

interface BookingForm {
    external_ref: string;
    agent_code: string;
    booking_date: string;
    amount: string;
    currency: string;
    product_code: string;
    status: string;
}

function EditBooking() {
    const { isLoading } = useAuth();

    const {
        adminAuthorization,
    } = useAuthorizationCheck();

    const { id } = useParams<{
        id: string;
    }>();

    const navigate = useNavigate();

    const [formData, setFormData] =
        useState<BookingForm>({
            external_ref: "",
            agent_code: "",
            booking_date: "",
            amount: "",
            currency: "",
            product_code: "",
            status: "",
        });

    const [loadingBooking, setLoadingBooking] =
        useState(true);

    const [saving, setSaving] =
        useState(false);

    const [error, setError] =
        useState("");

    const [success, setSuccess] =
        useState("");

    // ==========================================
    // AUTHORIZATION
    // ==========================================

    useEffect(() => {
        if (!isLoading) {
            adminAuthorization();
        }
    }, [isLoading]);

    // ==========================================
    // GET BOOKING
    // ==========================================

    useEffect(() => {
        if (isLoading) {
            return;
        }

        console.log(
            "Edit booking ID:",
            id
        );

        if (!id) {
            setLoadingBooking(false);
            setError(
                "Booking ID is missing."
            );
            return;
        }

        fetchBooking(id);
    }, [isLoading, id]);

    const fetchBooking = async (
        bookingId: string
    ) => {
        try {
            setLoadingBooking(true);
            setError("");

            const token =
                localStorage.getItem(
                    "token"
                );

            console.log(
                "GET:",
                `/bookings/${bookingId}`
            );

            const response =
                await api.get(
                    `/bookings/${bookingId}`,
                    {
                        headers: {
                            Authorization:
                                `Bearer ${token}`,
                        },
                    }
                );

            console.log(
                "FULL RESPONSE:",
                response
            );

            console.log(
                "RESPONSE DATA:",
                response.data
            );


            const booking =
                response.data?.data?.booking ??
                response.data?.data;

            console.log(
                "BOOKING:",
                booking
            );

            if (!booking) {
                setError(
                    "Booking details were not found."
                );
                return;
            }

            setFormData({
                external_ref:
                    booking.external_ref ??
                    "",

                agent_code:
                    booking.agent_code ??
                    "",

                booking_date:
                    booking.booking_date
                        ? String(
                            booking.booking_date
                        ).substring(0, 10)
                        : "",

                amount:
                    booking.amount !==
                        null &&
                        booking.amount !==
                        undefined
                        ? String(
                            booking.amount
                        )
                        : "",

                currency:
                    booking.currency ??
                    "",

                product_code:
                    booking.product_code ??
                    "",

                status:
                    booking.status ??
                    "",
            });

        } catch (error: any) {

            console.error(
                "GET BOOKING ERROR:",
                error
            );

            console.error(
                "ERROR RESPONSE:",
                error?.response?.data
            );

            setError(
                error?.response?.data
                    ?.error?.message ||
                error?.message ||
                "Failed to load booking."
            );

        } finally {

            console.log(
                "Setting loadingBooking = false"
            );

            setLoadingBooking(false);
        }
    };

    // ==========================================
    // INPUT CHANGE
    // ==========================================

    const handleChange = (
        e: React.ChangeEvent<
            HTMLInputElement |
            HTMLSelectElement
        >
    ) => {
        const {
            name,
            value,
        } = e.target;

        setFormData(
            (current) => ({
                ...current,
                [name]: value,
            })
        );
    };

    // ==========================================
    // UPDATE BOOKING
    // ==========================================

    const handleSubmit = async (
        e: React.FormEvent
    ) => {
        e.preventDefault();

        if (!id) {
            setError(
                "Booking ID is missing."
            );
            return;
        }

        try {
            setSaving(true);
            setError("");
            setSuccess("");

            const token =
                localStorage.getItem(
                    "token"
                );

            await api.patch(
                `/bookings/${id}`,
                {
                    external_ref:
                        formData.external_ref,

                    agent_code:
                        formData.agent_code,

                    booking_date:
                        formData.booking_date,

                    amount:
                        formData.amount,

                    currency:
                        formData.currency,

                    product_code:
                        formData.product_code,

                    status:
                        formData.status,
                },
                {
                    headers: {
                        Authorization:
                            `Bearer ${token}`,
                    },
                }
            );

            setSuccess(
                "Booking updated successfully."
            );

            setTimeout(() => {
                navigate(
                    "/viewbookings"
                );
            }, 1000);

        } catch (error: any) {

            console.error(
                "UPDATE BOOKING ERROR:",
                error
            );

            setError(
                error?.response?.data
                    ?.error?.message ||
                error?.message ||
                "Failed to update booking."
            );

        } finally {
            setSaving(false);
        }
    };

    // ==========================================
    // LOADING
    // ==========================================

    if (isLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                Loading authentication...
            </div>
        );
    }

    if (loadingBooking) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <div className="text-center">
                    <p className="text-sm text-gray-500">
                        Loading booking...
                    </p>

                    <p className="mt-2 text-xs text-gray-400">
                        Booking ID: {id ?? "undefined"}
                    </p>
                </div>
            </div>
        );
    }

    // ==========================================
    // PAGE
    // ==========================================

    return (
        <div className="flex min-h-screen bg-gray-50">

            <SidebarAdmin
                activeItem="Booking Details"
            />

            <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">

                <div className="mb-8">

                    <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
                        Edit Booking
                    </h1>

                    <p className="mt-2 text-sm text-gray-500">
                        Update booking information.
                    </p>

                </div>

                {error && (
                    <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
                        {error}
                    </div>
                )}

                {success && (
                    <div className="mb-6 rounded-lg border border-green-200 bg-green-50 p-4 text-sm font-medium text-green-700">
                        {success}
                    </div>
                )}

                <div className="max-w-3xl rounded-xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">

                    <form
                        onSubmit={
                            handleSubmit
                        }
                        className="space-y-6"
                    >

                        {/* External Reference */}
                        <div>
                            <label
                                htmlFor="external_ref"
                                className="mb-2 block text-sm font-medium text-gray-700"
                            >
                                External Reference
                            </label>

                            <input
                                id="external_ref"
                                name="external_ref"
                                type="text"
                                value={
                                    formData.external_ref
                                }
                                onChange={
                                    handleChange
                                }
                                required
                                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm"
                            />
                        </div>

                        {/* Agent Code */}
                        <div>
                            <label
                                htmlFor="agent_code"
                                className="mb-2 block text-sm font-medium text-gray-700"
                            >
                                Agent Code
                            </label>

                            <input
                                id="agent_code"
                                name="agent_code"
                                type="text"
                                value={
                                    formData.agent_code
                                }
                                onChange={
                                    handleChange
                                }
                                required
                                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm"
                            />
                        </div>

                        {/* Booking Date */}
                        <div>
                            <label
                                htmlFor="booking_date"
                                className="mb-2 block text-sm font-medium text-gray-700"
                            >
                                Booking Date
                            </label>

                            <input
                                id="booking_date"
                                name="booking_date"
                                type="date"
                                value={
                                    formData.booking_date
                                }
                                onChange={
                                    handleChange
                                }
                                required
                                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm"
                            />
                        </div>

                        {/* Amount */}
                        <div>
                            <label
                                htmlFor="amount"
                                className="mb-2 block text-sm font-medium text-gray-700"
                            >
                                Amount
                            </label>

                            <input
                                id="amount"
                                name="amount"
                                type="number"
                                step="0.01"
                                min="0"
                                value={
                                    formData.amount
                                }
                                onChange={
                                    handleChange
                                }
                                required
                                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm"
                            />
                        </div>

                        {/* Currency */}
                        <div>
                            <label
                                htmlFor="currency"
                                className="mb-2 block text-sm font-medium text-gray-700"
                            >
                                Currency
                            </label>

                            <input
                                id="currency"
                                name="currency"
                                type="text"
                                value={
                                    formData.currency
                                }
                                onChange={
                                    handleChange
                                }
                                required
                                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm uppercase"
                            />
                        </div>

                        {/* Product Code */}
                        <div>
                            <label
                                htmlFor="product_code"
                                className="mb-2 block text-sm font-medium text-gray-700"
                            >
                                Product Code
                            </label>

                            <input
                                id="product_code"
                                name="product_code"
                                type="text"
                                value={
                                    formData.product_code
                                }
                                onChange={
                                    handleChange
                                }
                                required
                                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm uppercase"
                            />
                        </div>

                        {/* Status */}
                        <div>
                            <label
                                htmlFor="status"
                                className="mb-2 block text-sm font-medium text-gray-700"
                            >
                                Status
                            </label>

                            <select
                                id="status"
                                name="status"
                                value={
                                    formData.status
                                }
                                onChange={
                                    handleChange
                                }
                                required
                                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm"
                            >
                                <option value="">
                                    Select status
                                </option>

                                <option value="ACTIVE">
                                    Active
                                </option>

                                <option value="CANCELLED">
                                    Cancelled
                                </option>

                                <option value="REFUNDED">
                                    Refunded
                                </option>
                            </select>
                        </div>

                        {/* Buttons */}
                        <div className="flex flex-col-reverse gap-3 border-t border-gray-200 pt-6 sm:flex-row sm:justify-end">

                            <Button
                                type="button"
                                variant="secondary"
                                onClick={() =>
                                    navigate(
                                        "/viewbookings"
                                    )
                                }
                            >
                                Cancel
                            </Button>

                            <Button
                                type="submit"
                                variant="primary"
                                disabled={saving}
                            >
                                {saving
                                    ? "Saving..."
                                    : "Update Booking"}
                            </Button>

                        </div>

                    </form>

                </div>

            </main>
        </div>
    );
}

export default EditBooking;