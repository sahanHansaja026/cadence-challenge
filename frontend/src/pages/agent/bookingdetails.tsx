import { useEffect, useState } from "react";

import { useAuth } from "../../context/AuthContext";

import {
    useAuthorizationCheck,
} from "../../authorization/AuthorizationCheck";

import api from "../../services/api";

import SidebarAgent
    from "../../component/layout/sidebar-agent";


interface Booking {

    id: string;

    agent_code: string;

    external_ref: string;

    product_code: string;

    booking_date: string;

    original_amount: string | null;

    original_currency: string | null;

    exchange_rate: string | null;

    amount: string;

    currency: string;

    status: string;

    company_id: string;
}


function ViewBookings_agents() {

    const {
        isLoading,
    } = useAuth();


    const {
        agentAuthorization,
    } = useAuthorizationCheck();


    const [bookings, setBookings] =
        useState<Booking[]>([]);


    const [loadingBookings, setLoadingBookings] =
        useState(false);


    const [error, setError] =
        useState("");


    /*
     * =====================================================
     * AGENT AUTHORIZATION
     * =====================================================
     */

    useEffect(() => {

        if (!isLoading) {

            agentAuthorization();

        }

    }, [
        isLoading,
        agentAuthorization,
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
     * LOADING
     * =====================================================
     */

    if (isLoading) {

        return (

            <div
                className="
                    flex
                    min-h-screen
                    items-center
                    justify-center
                "
            >

                <p
                    className="
                        text-sm
                        text-gray-500
                    "
                >
                    Loading...
                </p>

            </div>

        );

    }


    /*
     * =====================================================
     * PAGE
     * =====================================================
     */

    return (

        <div
            className="
                flex
                min-h-screen
                bg-gray-50
            "
        >


            {/* =================================================
                SIDEBAR
            ================================================= */}

            <SidebarAgent
                activeItem="Booking Details"
            />


            {/* =================================================
                MAIN
            ================================================= */}

            <main
                className="
                    min-w-0
                    flex-1
                    p-4
                    sm:p-6
                    lg:p-8
                "
            >


                {/* =================================================
                    HEADER
                ================================================= */}

                <div
                    className="
                        mb-6
                        sm:mb-8
                    "
                >

                    <h1
                        className="
                            text-2xl
                            font-bold
                            text-gray-900
                            sm:text-3xl
                        "
                    >
                        My Bookings
                    </h1>


                    <p
                        className="
                            mt-2
                            text-sm
                            text-gray-500
                        "
                    >
                        View your sales bookings,
                        original charged amounts,
                        exchange rates, and
                        LKR reporting amounts.
                    </p>

                </div>


                {/* =================================================
                    ERROR
                ================================================= */}

                {error && (

                    <div
                        className="
                            mb-6
                            rounded-lg
                            border
                            border-red-200
                            bg-red-50
                            p-4
                            text-sm
                            font-medium
                            text-red-700
                        "
                    >

                        {error}

                    </div>

                )}


                {/* =================================================
                    TABLE CARD
                ================================================= */}

                <div
                    className="
                        overflow-hidden
                        rounded-xl
                        border
                        border-gray-200
                        bg-white
                    "
                >


                    {/* =================================================
                        LOADING
                    ================================================= */}

                    {loadingBookings ? (

                        <div
                            className="
                                p-6
                                text-sm
                                text-gray-500
                            "
                        >
                            Loading bookings...
                        </div>


                    ) : bookings.length === 0 ? (


                        /* =================================================
                            EMPTY
                        ================================================= */

                        <div
                            className="
                                p-6
                                text-sm
                                text-gray-500
                            "
                        >
                            No bookings found.
                        </div>


                    ) : (


                        /* =================================================
                            TABLE
                        ================================================= */

                        <div
                            className="
                                w-full
                                overflow-x-auto
                            "
                        >

                            <table
                                className="
                                    min-w-[1100px]
                                    w-full
                                    text-left
                                "
                            >


                                {/* =================================================
                                    TABLE HEADER
                                ================================================= */}

                                <thead
                                    className="
                                        border-b
                                        border-gray-200
                                        bg-gray-50
                                    "
                                >

                                    <tr>


                                        {/* Booking ID */}

                                        <th
                                            className="
                                                whitespace-nowrap
                                                px-4
                                                py-4
                                                text-xs
                                                font-semibold
                                                uppercase
                                                tracking-wide
                                                text-gray-500
                                                sm:px-6
                                            "
                                        >
                                            Booking ID
                                        </th>


                                        {/* Agent */}

                                        <th
                                            className="
                                                whitespace-nowrap
                                                px-4
                                                py-4
                                                text-xs
                                                font-semibold
                                                uppercase
                                                tracking-wide
                                                text-gray-500
                                                sm:px-6
                                            "
                                        >
                                            Agent
                                        </th>


                                        {/* External Reference */}

                                        <th
                                            className="
                                                whitespace-nowrap
                                                px-4
                                                py-4
                                                text-xs
                                                font-semibold
                                                uppercase
                                                tracking-wide
                                                text-gray-500
                                                sm:px-6
                                            "
                                        >
                                            Reference
                                        </th>


                                        {/* Product */}

                                        <th
                                            className="
                                                whitespace-nowrap
                                                px-4
                                                py-4
                                                text-xs
                                                font-semibold
                                                uppercase
                                                tracking-wide
                                                text-gray-500
                                                sm:px-6
                                            "
                                        >
                                            Product
                                        </th>


                                        {/* Original Amount */}

                                        <th
                                            className="
                                                whitespace-nowrap
                                                px-4
                                                py-4
                                                text-xs
                                                font-semibold
                                                uppercase
                                                tracking-wide
                                                text-gray-500
                                                sm:px-6
                                            "
                                        >
                                            Original Amount
                                        </th>


                                        {/* LKR Amount */}

                                        <th
                                            className="
                                                whitespace-nowrap
                                                px-4
                                                py-4
                                                text-xs
                                                font-semibold
                                                uppercase
                                                tracking-wide
                                                text-gray-500
                                                sm:px-6
                                            "
                                        >
                                            LKR Amount
                                        </th>


                                        {/* Exchange Rate */}

                                        <th
                                            className="
                                                whitespace-nowrap
                                                px-4
                                                py-4
                                                text-xs
                                                font-semibold
                                                uppercase
                                                tracking-wide
                                                text-gray-500
                                                sm:px-6
                                            "
                                        >
                                            Exchange Rate
                                        </th>


                                        {/* Booking Date */}

                                        <th
                                            className="
                                                whitespace-nowrap
                                                px-4
                                                py-4
                                                text-xs
                                                font-semibold
                                                uppercase
                                                tracking-wide
                                                text-gray-500
                                                sm:px-6
                                            "
                                        >
                                            Booking Date
                                        </th>


                                        {/* Status */}

                                        <th
                                            className="
                                                whitespace-nowrap
                                                px-4
                                                py-4
                                                text-xs
                                                font-semibold
                                                uppercase
                                                tracking-wide
                                                text-gray-500
                                                sm:px-6
                                            "
                                        >
                                            Status
                                        </th>


                                    </tr>

                                </thead>


                                {/* =================================================
                                    TABLE BODY
                                ================================================= */}

                                <tbody
                                    className="
                                        divide-y
                                        divide-gray-200
                                    "
                                >


                                    {bookings.map(
                                        (booking) => (

                                            <tr
                                                key={
                                                    booking.id
                                                }
                                                className="
                                                    transition
                                                    hover:bg-gray-50
                                                "
                                            >


                                                {/* =================================================
                                                    BOOKING ID
                                                ================================================= */}

                                                <td
                                                    className="
                                                        whitespace-nowrap
                                                        px-4
                                                        py-4
                                                        text-sm
                                                        font-medium
                                                        text-gray-900
                                                        sm:px-6
                                                    "
                                                >
                                                    {
                                                        booking.id
                                                    }
                                                </td>


                                                {/* =================================================
                                                    AGENT
                                                ================================================= */}

                                                <td
                                                    className="
                                                        whitespace-nowrap
                                                        px-4
                                                        py-4
                                                        text-sm
                                                        text-gray-700
                                                        sm:px-6
                                                    "
                                                >
                                                    {
                                                        booking.agent_code
                                                    }
                                                </td>


                                                {/* =================================================
                                                    EXTERNAL REF
                                                ================================================= */}

                                                <td
                                                    className="
                                                        whitespace-nowrap
                                                        px-4
                                                        py-4
                                                        text-sm
                                                        text-gray-700
                                                        sm:px-6
                                                    "
                                                >
                                                    {
                                                        booking.external_ref
                                                    }
                                                </td>


                                                {/* =================================================
                                                    PRODUCT
                                                ================================================= */}

                                                <td
                                                    className="
                                                        whitespace-nowrap
                                                        px-4
                                                        py-4
                                                        text-sm
                                                        text-gray-700
                                                        sm:px-6
                                                    "
                                                >
                                                    {
                                                        booking.product_code
                                                    }
                                                </td>


                                                {/* =================================================
                                                    ORIGINAL AMOUNT
                                                ================================================= */}

                                                <td
                                                    className="
                                                        whitespace-nowrap
                                                        px-4
                                                        py-4
                                                        text-sm
                                                        font-medium
                                                        text-gray-900
                                                        sm:px-6
                                                    "
                                                >

                                                    {
                                                        booking.original_currency ??
                                                        "LKR"
                                                    }

                                                    {" "}

                                                    {Number(
                                                        booking.original_amount ??
                                                        booking.amount
                                                    ).toFixed(2)}

                                                </td>


                                                {/* =================================================
                                                    LKR AMOUNT
                                                ================================================= */}

                                                <td
                                                    className="
                                                        whitespace-nowrap
                                                        px-4
                                                        py-4
                                                        text-sm
                                                        font-medium
                                                        text-gray-900
                                                        sm:px-6
                                                    "
                                                >

                                                    {
                                                        booking.currency
                                                    }

                                                    {" "}

                                                    {Number(
                                                        booking.amount
                                                    ).toFixed(2)}

                                                </td>


                                                {/* =================================================
                                                    EXCHANGE RATE
                                                ================================================= */}

                                                <td
                                                    className="
                                                        whitespace-nowrap
                                                        px-4
                                                        py-4
                                                        text-sm
                                                        text-gray-700
                                                        sm:px-6
                                                    "
                                                >

                                                    {Number(
                                                        booking.exchange_rate ??
                                                        "1"
                                                    ).toFixed(6)}

                                                </td>


                                                {/* =================================================
                                                    BOOKING DATE
                                                ================================================= */}

                                                <td
                                                    className="
                                                        whitespace-nowrap
                                                        px-4
                                                        py-4
                                                        text-sm
                                                        text-gray-500
                                                        sm:px-6
                                                    "
                                                >

                                                    {new Date(
                                                        booking.booking_date
                                                    ).toLocaleDateString()}

                                                </td>


                                                {/* =================================================
                                                    STATUS
                                                ================================================= */}

                                                <td
                                                    className="
                                                        whitespace-nowrap
                                                        px-4
                                                        py-4
                                                        sm:px-6
                                                    "
                                                >

                                                    <span
                                                        className={
                                                            booking.status ===
                                                                "ACTIVE"

                                                                ? `
                                                                    inline-flex
                                                                    rounded-md
                                                                    bg-green-100
                                                                    px-2.5
                                                                    py-1
                                                                    text-xs
                                                                    font-medium
                                                                    text-green-700
                                                                `

                                                                : `
                                                                    inline-flex
                                                                    rounded-md
                                                                    bg-red-100
                                                                    px-2.5
                                                                    py-1
                                                                    text-xs
                                                                    font-medium
                                                                    text-red-700
                                                                `
                                                        }
                                                    >

                                                        {
                                                            booking.status
                                                        }

                                                    </span>

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