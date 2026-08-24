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

import Input from "../../component/ui/input";
import Button from "../../component/ui/Button";
import SidebarAdmin from "../../component/layout/sidebar-admin";
import api from "../../services/api";


/*
 * ---------------------------------------------------------
 * TYPES
 * ---------------------------------------------------------
 */

type PayoutRunStatus =
    | "DRAFT"
    | "FINALISED";


type CommissionType =
    | "TIERED"
    | "PRODUCT_OVERRIDE"
    | "UNKNOWN";


interface PayoutRun {
    id: string;
    company_id: string;
    run_no: number;
    period_start: string;
    period_end: string;
    status: PayoutRunStatus;
    total_amount: string;
    created_at: string;
}


interface PayoutLineItem {
    id: string;
    payout_run_id: string;
    agent_code: string;
    booking_count: number;
    gross_volume: string;
    commission_rate: string;
    commission_amount: string;
}


interface PayoutBooking {
    id: string;
    payout_run_id: string;
    booking_id: string;
    agent_code: string;
    booking_date: string;
    amount: string;
    currency: string;
    product_code: string;
}


interface PayoutRunDetails {
    payoutRun: PayoutRun;
    lineItems: PayoutLineItem[];
    bookings: PayoutBooking[];
}


interface PayoutRunForm {
    periodStart: string;
    periodEnd: string;
}


const emptyForm: PayoutRunForm = {
    periodStart: "",
    periodEnd: "",
};


/*
 * ---------------------------------------------------------
 * COMPONENT
 * ---------------------------------------------------------
 */

function PayoutRuns() {

    const {
        isLoading,
    } = useAuth();


    const {
        adminAuthorization,
    } = useAuthorizationCheck();


    /*
     * -----------------------------------------------------
     * STATE
     * -----------------------------------------------------
     */

    const [
        payoutRuns,
        setPayoutRuns,
    ] = useState<PayoutRun[]>([]);


    const [
        loading,
        setLoading,
    ] = useState(true);


    const [
        detailsLoading,
        setDetailsLoading,
    ] = useState(false);


    const [
        saving,
        setSaving,
    ] = useState(false);


    const [
        showForm,
        setShowForm,
    ] = useState(false);


    const [
        selectedRun,
        setSelectedRun,
    ] = useState<PayoutRunDetails | null>(
        null,
    );


    const [
        form,
        setForm,
    ] = useState<PayoutRunForm>({
        ...emptyForm,
    });


    const [
        message,
        setMessage,
    ] = useState("");


    const [
        error,
        setError,
    ] = useState("");


    /*
     * -----------------------------------------------------
     * ADMIN AUTHORIZATION
     * -----------------------------------------------------
     */

    useEffect(() => {

        if (!isLoading) {

            adminAuthorization();

        }

    }, [isLoading]);


    /*
     * -----------------------------------------------------
     * LOAD PAYOUT RUNS
     * -----------------------------------------------------
     */

    useEffect(() => {

        if (!isLoading) {

            fetchPayoutRuns();

        }

    }, [isLoading]);


    /*
     * -----------------------------------------------------
     * FETCH PAYOUT RUNS
     * -----------------------------------------------------
     */

    const fetchPayoutRuns = async () => {

        try {

            setLoading(true);
            setError("");


            const token =
                localStorage.getItem(
                    "token",
                );


            const response =
                await api.get(
                    "/payout-runs",
                    {
                        headers: {
                            Authorization:
                                `Bearer ${token}`,
                        },
                    },
                );


            setPayoutRuns(
                response.data?.data
                    ?.payoutRuns || [],
            );

        } catch (error: any) {

            console.error(
                "Get payout runs error:",
                error,
            );


            setError(
                error?.response?.data
                    ?.error?.message ||
                "Failed to load payout runs.",
            );

        } finally {

            setLoading(false);

        }
    };


    /*
     * -----------------------------------------------------
     * OPEN CREATE FORM
     * -----------------------------------------------------
     */

    const openCreateForm = () => {

        setForm({
            ...emptyForm,
        });


        setSelectedRun(null);


        setMessage("");
        setError("");


        setShowForm(true);

    };


    /*
     * -----------------------------------------------------
     * CLOSE FORM
     * -----------------------------------------------------
     */

    const closeForm = () => {

        setShowForm(false);


        setForm({
            ...emptyForm,
        });

    };


    /*
     * -----------------------------------------------------
     * UPDATE FORM
     * -----------------------------------------------------
     */

    const updateField = (
        field: keyof PayoutRunForm,
        value: string,
    ) => {

        setForm(
            previous => ({
                ...previous,
                [field]: value,
            }),
        );

    };


    /*
     * -----------------------------------------------------
     * CREATE PAYOUT RUN
     * -----------------------------------------------------
     */

    const handleSubmit = async (
        e: React.FormEvent,
    ) => {

        e.preventDefault();


        setMessage("");
        setError("");


        /*
         * Validate period start.
         */

        if (!form.periodStart) {

            setError(
                "Period start date is required.",
            );

            return;
        }


        /*
         * Validate period end.
         */

        if (!form.periodEnd) {

            setError(
                "Period end date is required.",
            );

            return;
        }


        /*
         * Validate date range.
         */

        if (
            form.periodStart >
            form.periodEnd
        ) {

            setError(
                "Period end must be on or after period start.",
            );

            return;
        }


        try {

            setSaving(true);


            const token =
                localStorage.getItem(
                    "token",
                );


            const data = {

                periodStart:
                    form.periodStart,

                periodEnd:
                    form.periodEnd,

            };


            const response =
                await api.post(
                    "/payout-runs",
                    data,
                    {
                        headers: {
                            Authorization:
                                `Bearer ${token}`,
                        },
                    },
                );


            const createdRun =
                response.data?.data
                    ?.payoutRun;


            setMessage(
                `Payout run #${createdRun?.run_no ?? ""} created successfully.`,
            );


            closeForm();


            await fetchPayoutRuns();

        } catch (error: any) {

            console.error(
                "Create payout run error:",
                error,
            );


            setError(
                error?.response?.data
                    ?.error?.message ||
                "Failed to create payout run.",
            );

        } finally {

            setSaving(false);

        }

    };


    /*
     * -----------------------------------------------------
     * VIEW PAYOUT RUN DETAILS
     * -----------------------------------------------------
     */

    const viewPayoutRun = async (
        payoutRunId: string,
    ) => {

        try {

            setDetailsLoading(true);
            setError("");


            const token =
                localStorage.getItem(
                    "token",
                );


            const response =
                await api.get(
                    `/payout-runs/${payoutRunId}`,
                    {
                        headers: {
                            Authorization:
                                `Bearer ${token}`,
                        },
                    },
                );


            const data =
                response.data?.data;


            /*
             * Current backend returns:
             *
             * {
             *   payoutRun
             * }
             *
             * If backend later returns:
             *
             * {
             *   payoutRun,
             *   lineItems,
             *   bookings
             * }
             *
             * this frontend will also display them.
             */

            setSelectedRun({

                payoutRun:
                    data?.payoutRun,

                lineItems:
                    data?.lineItems || [],

                bookings:
                    data?.bookings || [],

            });

        } catch (error: any) {

            console.error(
                "Get payout run details error:",
                error,
            );


            setError(
                error?.response?.data
                    ?.error?.message ||
                "Failed to load payout run details.",
            );

        } finally {

            setDetailsLoading(false);

        }

    };


    /*
     * -----------------------------------------------------
     * FORMAT DATE
     * -----------------------------------------------------
     */

    const formatDate = (
        value: string,
    ) => {

        if (!value) {

            return "-";

        }


        return value.substring(
            0,
            10,
        );

    };


    /*
     * -----------------------------------------------------
     * FORMAT AMOUNT
     * -----------------------------------------------------
     */

    const formatAmount = (
        value: string | number | null | undefined,
    ) => {

        if (
            value === null ||
            value === undefined ||
            value === ""
        ) {

            return "0.00";

        }


        return Number(value).toFixed(2);

    };


    /*
     * -----------------------------------------------------
     * COMMISSION TYPE
     *
     * This is a temporary frontend helper.
     *
     * The backend should eventually return the
     * actual commission type used for each booking.
     * -----------------------------------------------------
     */

    const getCommissionType = (
        booking: PayoutBooking,
    ): CommissionType => {

        /*
         * We cannot know the actual rule from the
         * current payout booking response.
         *
         * Therefore don't falsely claim that it was
         * an override.
         */

        if (!booking) {

            return "UNKNOWN";

        }


        return "UNKNOWN";

    };


    /*
     * -----------------------------------------------------
     * CLOSE DETAILS
     * -----------------------------------------------------
     */

    const closeDetails = () => {

        setSelectedRun(null);

    };


    /*
     * -----------------------------------------------------
     * LOADING
     * -----------------------------------------------------
     */

    if (
        isLoading ||
        loading
    ) {

        return (

            <div className="p-8 text-gray-900">

                Loading payout runs...

            </div>

        );

    }


    /*
     * -----------------------------------------------------
     * UI
     * -----------------------------------------------------
     */

    return (

        <div className="flex min-h-screen bg-gray-50">


            {/* =================================================
                SIDEBAR
            ================================================= */}

            <SidebarAdmin
                activeItem="Payout Runs"
            />


            {/* =================================================
                MAIN
            ================================================= */}

            <main className="flex-1 p-8">


                {/* =================================================
                    HEADER
                ================================================= */}

                <div className="mb-8 flex items-center justify-between">

                    <div>

                        <h1 className="text-3xl font-bold text-gray-900">

                            Payout Runs

                        </h1>


                        <p className="mt-2 text-sm text-gray-500">

                            Create and manage payout runs and
                            review commission calculations.

                        </p>

                    </div>


                    <Button
                        type="button"
                        variant="primary"
                        onClick={
                            openCreateForm
                        }
                    >

                        Create Payout Run

                    </Button>

                </div>


                {/* =================================================
                    SUCCESS
                ================================================= */}

                {message && (

                    <div className="mb-6 rounded-lg border border-green-200 bg-green-50 p-4 text-sm font-medium text-green-700">

                        {message}

                    </div>

                )}


                {/* =================================================
                    ERROR
                ================================================= */}

                {error && (

                    <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">

                        {error}

                    </div>

                )}


                {/* =================================================
                    CREATE FORM
                ================================================= */}

                {showForm && (

                    <div className="mb-8 max-w-2xl rounded-xl border border-gray-200 bg-white p-6">


                        <h2 className="mb-2 text-xl font-semibold text-gray-900">

                            Create Payout Run

                        </h2>


                        <p className="mb-6 text-sm text-gray-500">

                            Select the period for this payout run.

                        </p>


                        <form
                            onSubmit={
                                handleSubmit
                            }
                            className="space-y-5"
                        >


                            {/* PERIOD START */}

                            <Input
                                label="Period Start"
                                type="date"
                                value={
                                    form.periodStart
                                }
                                required
                                onChange={(e) =>
                                    updateField(
                                        "periodStart",
                                        e.target.value,
                                    )
                                }
                            />


                            {/* PERIOD END */}

                            <Input
                                label="Period End"
                                type="date"
                                value={
                                    form.periodEnd
                                }
                                required
                                onChange={(e) =>
                                    updateField(
                                        "periodEnd",
                                        e.target.value,
                                    )
                                }
                            />


                            {/* BUTTONS */}

                            <div className="flex gap-3">


                                <Button
                                    type="submit"
                                    variant="primary"
                                    disabled={
                                        saving
                                    }
                                >

                                    {saving
                                        ? "Creating..."
                                        : "Create Payout Run"}

                                </Button>


                                <Button
                                    type="button"
                                    variant="secondary"
                                    onClick={
                                        closeForm
                                    }
                                >

                                    Cancel

                                </Button>


                            </div>


                        </form>

                    </div>

                )}


                {/* =================================================
                    SELECTED PAYOUT RUN
                ================================================= */}

                {selectedRun && (

                    <div className="mb-8 rounded-xl border border-gray-200 bg-white p-6">


                        {/* HEADER */}

                        <div className="mb-6 flex items-center justify-between">


                            <div>

                                <h2 className="text-xl font-semibold text-gray-900">

                                    Payout Run #

                                    {
                                        selectedRun
                                            .payoutRun
                                            .run_no
                                    }

                                </h2>


                                <p className="mt-1 text-sm text-gray-500">

                                    {
                                        formatDate(
                                            selectedRun
                                                .payoutRun
                                                .period_start,
                                        )
                                    }

                                    {" → "}

                                    {
                                        formatDate(
                                            selectedRun
                                                .payoutRun
                                                .period_end,
                                        )
                                    }

                                </p>

                            </div>


                            <Button
                                type="button"
                                variant="secondary"
                                onClick={
                                    closeDetails
                                }
                            >

                                Close

                            </Button>


                        </div>


                        {/* SUMMARY */}

                        <div className="grid gap-4 sm:grid-cols-3">


                            {/* STATUS */}

                            <div className="rounded-lg bg-gray-50 p-4">

                                <p className="text-xs font-medium uppercase text-gray-500">

                                    Status

                                </p>


                                <p className="mt-2 font-semibold text-gray-900">

                                    {
                                        selectedRun
                                            .payoutRun
                                            .status
                                    }

                                </p>

                            </div>


                            {/* PERIOD */}

                            <div className="rounded-lg bg-gray-50 p-4">

                                <p className="text-xs font-medium uppercase text-gray-500">

                                    Period

                                </p>


                                <p className="mt-2 font-semibold text-gray-900">

                                    {
                                        formatDate(
                                            selectedRun
                                                .payoutRun
                                                .period_start,
                                        )
                                    }

                                    {" - "}

                                    {
                                        formatDate(
                                            selectedRun
                                                .payoutRun
                                                .period_end,
                                        )
                                    }

                                </p>

                            </div>


                            {/* TOTAL */}

                            <div className="rounded-lg bg-gray-50 p-4">

                                <p className="text-xs font-medium uppercase text-gray-500">

                                    Total Commission

                                </p>


                                <p className="mt-2 text-xl font-bold text-gray-900">

                                    {
                                        formatAmount(
                                            selectedRun
                                                .payoutRun
                                                .total_amount,
                                        )
                                    }

                                </p>

                            </div>


                        </div>


                        {/* =================================================
                            DRAFT INFORMATION
                        ================================================= */}

                        {selectedRun
                            .payoutRun
                            .status === "DRAFT" && (

                                <div className="mt-6 rounded-lg border border-yellow-200 bg-yellow-50 p-4">

                                    <p className="text-sm text-yellow-800">

                                        This payout run is currently a

                                        <strong>
                                            {" DRAFT"}
                                        </strong>

                                        . The commission calculation
                                        has been generated, but the
                                        payout has not been finalised.

                                    </p>

                                </div>

                            )}


                        {/* =================================================
                            LINE ITEMS
                        ================================================= */}

                        <div className="mt-8">


                            <div className="mb-4 flex items-center justify-between">

                                <h3 className="text-lg font-semibold text-gray-900">

                                    Agent Commission Summary

                                </h3>


                                <span className="text-sm text-gray-500">

                                    {
                                        selectedRun
                                            .lineItems
                                            .length
                                    }

                                    {" agents"}

                                </span>

                            </div>


                            {selectedRun.lineItems.length === 0 ? (

                                <div className="rounded-lg border border-gray-200 bg-gray-50 p-6 text-center text-sm text-gray-500">

                                    No payout line items were returned
                                    by the backend.

                                </div>

                            ) : (

                                <div className="overflow-x-auto rounded-lg border border-gray-200">

                                    <table className="w-full text-left text-sm">


                                        <thead className="bg-gray-50 text-xs uppercase text-gray-500">

                                            <tr>

                                                <th className="px-5 py-4">

                                                    Agent

                                                </th>


                                                <th className="px-5 py-4">

                                                    Bookings

                                                </th>


                                                <th className="px-5 py-4">

                                                    Gross Volume

                                                </th>


                                                <th className="px-5 py-4">

                                                    Effective Rate

                                                </th>


                                                <th className="px-5 py-4">

                                                    Commission

                                                </th>

                                            </tr>

                                        </thead>


                                        <tbody className="divide-y divide-gray-100">


                                            {selectedRun.lineItems.map(
                                                line => (

                                                    <tr
                                                        key={
                                                            line.id
                                                        }
                                                        className="hover:bg-gray-50"
                                                    >


                                                        <td className="px-5 py-4 font-semibold text-gray-900">

                                                            {
                                                                line.agent_code
                                                            }

                                                        </td>


                                                        <td className="px-5 py-4 text-gray-700">

                                                            {
                                                                line.booking_count
                                                            }

                                                        </td>


                                                        <td className="px-5 py-4 text-gray-700">

                                                            {
                                                                formatAmount(
                                                                    line.gross_volume,
                                                                )
                                                            }

                                                        </td>


                                                        <td className="px-5 py-4 text-gray-700">

                                                            {
                                                                line.commission_rate
                                                            }
                                                            %

                                                        </td>


                                                        <td className="px-5 py-4 font-semibold text-gray-900">

                                                            {
                                                                formatAmount(
                                                                    line.commission_amount,
                                                                )
                                                            }

                                                        </td>


                                                    </tr>

                                                ),
                                            )}


                                        </tbody>


                                    </table>

                                </div>

                            )}

                        </div>


                        {/* =================================================
                            BOOKING DETAILS
                        ================================================= */}

                        <div className="mt-8">


                            <div className="mb-4">

                                <h3 className="text-lg font-semibold text-gray-900">

                                    Payout Bookings

                                </h3>


                                <p className="mt-1 text-sm text-gray-500">

                                    Bookings included in this payout run.

                                </p>

                            </div>


                            {selectedRun.bookings.length === 0 ? (

                                <div className="rounded-lg border border-gray-200 bg-gray-50 p-6 text-center text-sm text-gray-500">

                                    No booking details were returned
                                    by the backend.

                                </div>

                            ) : (

                                <div className="overflow-x-auto rounded-lg border border-gray-200">

                                    <table className="w-full text-left text-sm">


                                        <thead className="bg-gray-50 text-xs uppercase text-gray-500">

                                            <tr>

                                                <th className="px-5 py-4">

                                                    Booking

                                                </th>


                                                <th className="px-5 py-4">

                                                    Agent

                                                </th>


                                                <th className="px-5 py-4">

                                                    Date

                                                </th>


                                                <th className="px-5 py-4">

                                                    Product

                                                </th>


                                                <th className="px-5 py-4">

                                                    Amount

                                                </th>


                                                <th className="px-5 py-4">

                                                    Commission Rule

                                                </th>

                                            </tr>

                                        </thead>


                                        <tbody className="divide-y divide-gray-100">


                                            {selectedRun.bookings.map(
                                                booking => {


                                                    const commissionType =
                                                        getCommissionType(
                                                            booking,
                                                        );


                                                    return (

                                                        <tr
                                                            key={
                                                                booking.id
                                                            }
                                                            className="hover:bg-gray-50"
                                                        >


                                                            <td className="px-5 py-4 font-medium text-gray-900">

                                                                {
                                                                    booking.booking_id
                                                                }

                                                            </td>


                                                            <td className="px-5 py-4 text-gray-700">

                                                                {
                                                                    booking.agent_code
                                                                }

                                                            </td>


                                                            <td className="px-5 py-4 text-gray-700">

                                                                {
                                                                    formatDate(
                                                                        booking.booking_date,
                                                                    )
                                                                }

                                                            </td>


                                                            <td className="px-5 py-4">

                                                                <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700">

                                                                    {
                                                                        booking.product_code
                                                                    }

                                                                </span>

                                                            </td>


                                                            <td className="px-5 py-4 font-medium text-gray-900">

                                                                {
                                                                    formatAmount(
                                                                        booking.amount,
                                                                    )
                                                                }

                                                                {" "}

                                                                {
                                                                    booking.currency
                                                                }

                                                            </td>


                                                            <td className="px-5 py-4">


                                                                {commissionType ===
                                                                    "PRODUCT_OVERRIDE" ? (

                                                                    <span className="rounded-full bg-purple-100 px-3 py-1 text-xs font-semibold text-purple-700">

                                                                        PRODUCT
                                                                        {" "}
                                                                        OVERRIDE

                                                                    </span>

                                                                ) : commissionType ===
                                                                    "TIERED" ? (

                                                                    <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">

                                                                        TIERED

                                                                    </span>

                                                                ) : (

                                                                    <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">

                                                                        Not
                                                                        available

                                                                    </span>

                                                                )}

                                                            </td>


                                                        </tr>

                                                    );

                                                },
                                            )}


                                        </tbody>


                                    </table>

                                </div>

                            )}

                        </div>


                        {/* =================================================
                            COMMISSION EXPLANATION
                        ================================================= */}

                        <div className="mt-8 rounded-lg border border-blue-200 bg-blue-50 p-5">


                            <h3 className="font-semibold text-blue-900">

                                How commission is calculated

                            </h3>


                            <div className="mt-3 space-y-2 text-sm text-blue-800">


                                <p>

                                    <strong>
                                        Tiered:
                                    </strong>

                                    {" "}
                                    Normal bookings use the applicable
                                    tiered commission rules based on
                                    the booking date and amount.

                                </p>


                                <p>

                                    <strong>
                                        Product Override:
                                    </strong>

                                    {" "}
                                    If a PRODUCT_OVERRIDE rule exists
                                    for the booking product and booking
                                    date, that rule takes priority over
                                    the normal tiered calculation.

                                </p>


                                <p>

                                    <strong>
                                        Final Commission:
                                    </strong>

                                    {" "}
                                    The commissions for all applicable
                                    bookings are added together to
                                    produce the payout run total.

                                </p>


                            </div>

                        </div>


                    </div>

                )}


                {/* =================================================
                    PAYOUT TABLE
                ================================================= */}

                <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">


                    <div className="border-b border-gray-200 px-6 py-4">

                        <h2 className="font-semibold text-gray-900">

                            Existing Payout Runs

                        </h2>

                    </div>


                    {payoutRuns.length === 0 ? (

                        <div className="p-10 text-center">


                            <p className="text-gray-500">

                                No payout runs found.

                            </p>


                            <div className="mt-4">

                                <Button
                                    type="button"
                                    variant="primary"
                                    onClick={
                                        openCreateForm
                                    }
                                >

                                    Create First Payout Run

                                </Button>

                            </div>


                        </div>

                    ) : (

                        <div className="overflow-x-auto">


                            <table className="w-full text-left text-sm">


                                <thead className="bg-gray-50 text-xs uppercase text-gray-500">

                                    <tr>

                                        <th className="px-6 py-4">

                                            Run

                                        </th>


                                        <th className="px-6 py-4">

                                            Period

                                        </th>


                                        <th className="px-6 py-4">

                                            Status

                                        </th>


                                        <th className="px-6 py-4">

                                            Total Commission

                                        </th>


                                        <th className="px-6 py-4">

                                            Created

                                        </th>


                                        <th className="px-6 py-4">

                                            Actions

                                        </th>

                                    </tr>

                                </thead>


                                <tbody className="divide-y divide-gray-100">


                                    {payoutRuns.map(
                                        run => (

                                            <tr
                                                key={
                                                    run.id
                                                }
                                                className="hover:bg-gray-50"
                                            >


                                                <td className="px-6 py-4 font-semibold text-gray-900">

                                                    #

                                                    {
                                                        run.run_no
                                                    }

                                                </td>


                                                <td className="px-6 py-4 text-gray-700">

                                                    {
                                                        formatDate(
                                                            run.period_start,
                                                        )
                                                    }

                                                    {" → "}

                                                    {
                                                        formatDate(
                                                            run.period_end,
                                                        )
                                                    }

                                                </td>


                                                <td className="px-6 py-4">


                                                    <span
                                                        className={
                                                            run.status ===
                                                                "FINALISED"

                                                                ? "rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700"

                                                                : "rounded-full bg-yellow-100 px-3 py-1 text-xs font-medium text-yellow-700"
                                                        }
                                                    >

                                                        {
                                                            run.status
                                                        }

                                                    </span>

                                                </td>


                                                <td className="px-6 py-4 font-medium text-gray-900">

                                                    {
                                                        formatAmount(
                                                            run.total_amount,
                                                        )
                                                    }

                                                </td>


                                                <td className="px-6 py-4 text-gray-500">

                                                    {
                                                        formatDate(
                                                            run.created_at,
                                                        )
                                                    }

                                                </td>


                                                <td className="px-6 py-4">


                                                    <Button
                                                        type="button"
                                                        variant="secondary"
                                                        disabled={
                                                            detailsLoading
                                                        }
                                                        onClick={() =>
                                                            viewPayoutRun(
                                                                run.id,
                                                            )
                                                        }
                                                    >

                                                        {detailsLoading
                                                            ? "Loading..."
                                                            : "View"}

                                                    </Button>


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


export default PayoutRuns;