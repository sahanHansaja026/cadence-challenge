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


type PayoutRunStatus =
    | "DRAFT"
    | "FINALISED";


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


interface PayoutRunForm {
    periodStart: string;
    periodEnd: string;
}


const emptyForm: PayoutRunForm = {
    periodStart: "",
    periodEnd: "",
};


function PayoutRuns() {

    const {
        isLoading,
    } = useAuth();

    const {
        adminAuthorization,
    } = useAuthorizationCheck();


    const [payoutRuns, setPayoutRuns] =
        useState<PayoutRun[]>([]);

    const [loading, setLoading] =
        useState(true);

    const [saving, setSaving] =
        useState(false);

    const [showForm, setShowForm] =
        useState(false);

    const [selectedRun, setSelectedRun] =
        useState<PayoutRun | null>(null);

    const [form, setForm] =
        useState<PayoutRunForm>({
            ...emptyForm,
        });

    const [message, setMessage] =
        useState("");

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
     * GET PAYOUT RUNS
     */
    useEffect(() => {

        if (!isLoading) {
            fetchPayoutRuns();
        }

    }, [isLoading]);


    /*
     * FETCH PAYOUT RUNS
     */
    const fetchPayoutRuns = async () => {

        try {

            setLoading(true);
            setError("");

            const token =
                localStorage.getItem("token");


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
                response.data.data
                    .payoutRuns || [],
            );

        } catch (error: any) {

            console.error(
                "Get payout runs error:",
                error,
            );


            setError(
                error?.response?.data?.error
                    ?.message ||
                "Failed to load payout runs.",
            );

        } finally {

            setLoading(false);

        }
    };


    /*
     * OPEN CREATE FORM
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
     * CLOSE FORM
     */
    const closeForm = () => {

        setShowForm(false);

        setSelectedRun(null);

        setForm({
            ...emptyForm,
        });

    };


    /*
     * UPDATE FORM
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
     * CREATE PAYOUT RUN
     */
    const handleSubmit = async (
        e: React.FormEvent,
    ) => {

        e.preventDefault();

        setMessage("");
        setError("");


        /*
         * Frontend validation
         */
        if (!form.periodStart) {

            setError(
                "Period start date is required.",
            );

            return;
        }


        if (!form.periodEnd) {

            setError(
                "Period end date is required.",
            );

            return;
        }


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
                localStorage.getItem("token");


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
                response.data.data
                    .payoutRun;


            setMessage(
                `Payout run #${createdRun.run_no} created successfully.`,
            );


            closeForm();

            await fetchPayoutRuns();

        } catch (error: any) {

            console.error(
                "Create payout run error:",
                error,
            );


            setError(
                error?.response?.data?.error
                    ?.message ||
                "Failed to create payout run.",
            );

        } finally {

            setSaving(false);

        }
    };


    /*
     * VIEW PAYOUT RUN
     */
    const viewPayoutRun = async (
        payoutRunId: string,
    ) => {

        try {

            setError("");

            const token =
                localStorage.getItem("token");


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


            setSelectedRun(
                response.data.data
                    .payoutRun,
            );

        } catch (error: any) {

            console.error(
                "Get payout run error:",
                error,
            );


            setError(
                error?.response?.data?.error
                    ?.message ||
                "Failed to load payout run.",
            );

        }
    };


    /*
     * FORMAT DATE
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
     * FORMAT MONEY
     *
     * Do not use floating point
     * calculations here.
     *
     * Backend already returns the
     * exact decimal value.
     */
    const formatAmount = (
        value: string,
    ) => {

        return value || "0.00";
    };


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


    return (
        <div className="flex min-h-screen bg-gray-50">

            {/* SIDEBAR */}

            <SidebarAdmin
                activeItem="Payout Runs"
            />


            {/* MAIN */}

            <main className="flex-1 p-8">

                {/* HEADER */}

                <div className="mb-8 flex items-center justify-between">

                    <div>

                        <h1 className="text-3xl font-bold text-gray-900">
                            Payout Runs
                        </h1>

                        <p className="mt-2 text-sm text-gray-500">
                            Create and manage monthly payout runs for your company.
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


                {/* SUCCESS MESSAGE */}

                {message && (

                    <div className="mb-6 rounded-lg border border-green-200 bg-green-50 p-4 text-sm font-medium text-green-700">

                        {message}

                    </div>

                )}


                {/* ERROR MESSAGE */}

                {error && (

                    <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">

                        {error}

                    </div>

                )}


                {/* CREATE FORM */}

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


                {/* SELECTED PAYOUT RUN */}

                {selectedRun && (

                    <div className="mb-8 rounded-xl border border-gray-200 bg-white p-6">

                        <div className="mb-6 flex items-center justify-between">

                            <div>

                                <h2 className="text-xl font-semibold text-gray-900">
                                    Payout Run #
                                    {
                                        selectedRun.run_no
                                    }
                                </h2>

                                <p className="mt-1 text-sm text-gray-500">
                                    {
                                        formatDate(
                                            selectedRun.period_start,
                                        )
                                    }
                                    {" → "}
                                    {
                                        formatDate(
                                            selectedRun.period_end,
                                        )
                                    }
                                </p>

                            </div>


                            <Button
                                type="button"
                                variant="secondary"
                                onClick={() =>
                                    setSelectedRun(
                                        null,
                                    )
                                }
                            >
                                Close
                            </Button>

                        </div>


                        <div className="grid gap-4 sm:grid-cols-3">

                            <div className="rounded-lg bg-gray-50 p-4">

                                <p className="text-xs font-medium uppercase text-gray-500">
                                    Status
                                </p>

                                <p className="mt-2 font-semibold text-gray-900">
                                    {
                                        selectedRun.status
                                    }
                                </p>

                            </div>


                            <div className="rounded-lg bg-gray-50 p-4">

                                <p className="text-xs font-medium uppercase text-gray-500">
                                    Period
                                </p>

                                <p className="mt-2 font-semibold text-gray-900">
                                    {
                                        formatDate(
                                            selectedRun.period_start,
                                        )
                                    }
                                    {" - "}
                                    {
                                        formatDate(
                                            selectedRun.period_end,
                                        )
                                    }
                                </p>

                            </div>


                            <div className="rounded-lg bg-gray-50 p-4">

                                <p className="text-xs font-medium uppercase text-gray-500">
                                    Total Amount
                                </p>

                                <p className="mt-2 font-semibold text-gray-900">
                                    {
                                        formatAmount(
                                            selectedRun.total_amount,
                                        )
                                    }
                                </p>

                            </div>

                        </div>


                        <div className="mt-6 rounded-lg border border-yellow-200 bg-yellow-50 p-4">

                            <p className="text-sm text-yellow-800">

                                This payout run is currently a
                                <strong> DRAFT</strong>.
                                Commission line-item calculation
                                and finalisation will be handled
                                separately.

                            </p>

                        </div>

                    </div>

                )}


                {/* PAYOUT TABLE */}

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
                                            Total
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
                                                        onClick={() =>
                                                            viewPayoutRun(
                                                                run.id,
                                                            )
                                                        }
                                                    >
                                                        View
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