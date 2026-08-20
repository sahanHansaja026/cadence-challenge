import {
    useEffect,
    useState,
} from "react";

import { useAuth } from "../../context/AuthContext";
import { useAuthorizationCheck } from "../../authorization/AuthorizationCheck";
import SidebarAdmin from "../../component/layout/sidebar-admin";
import SidebarFinance from "../../component/layout/sidebar-finace";

interface ExchangeRate {
    id: string;
    effective_from: string;
    currency: string;
    rate_to_lkr: string;
    source: string;
    created_at: string;
}

function ExchangeRatePage() {
    const { isLoading } = useAuth();

    const { financeAuthorization } =
        useAuthorizationCheck();

    const [effectiveFrom, setEffectiveFrom] =
        useState("");

    const [currency, setCurrency] =
        useState("USD");

    const [rateToLkr, setRateToLkr] =
        useState("");

    const [source, setSource] =
        useState("");

    const [rates, setRates] =
        useState<ExchangeRate[]>([]);

    const [loadingRates, setLoadingRates] =
        useState(false);

    const [submitting, setSubmitting] =
        useState(false);

    const [error, setError] =
        useState("");

    const [success, setSuccess] =
        useState("");


    /*
     * ADMIN AUTHORIZATION
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
     * LOAD EXCHANGE RATES
     */
    useEffect(() => {
        if (!isLoading) {
            loadExchangeRates();
        }
    }, [isLoading]);


    async function loadExchangeRates() {
        try {
            setLoadingRates(true);
            setError("");

            const token =
                localStorage.getItem("token");

            const response =
                await fetch(
                    "http://localhost:3001/api/exchange-rates",
                    {
                        method: "GET",
                        headers: {
                            "Content-Type":
                                "application/json",

                            ...(token
                                ? {
                                    Authorization:
                                        `Bearer ${token}`,
                                }
                                : {}),
                        },
                    },
                );

            if (!response.ok) {
                throw new Error(
                    "Failed to load exchange rates",
                );
            }

            const data:
                ExchangeRate[] =
                await response.json();

            setRates(data);

        } catch (error) {

            setError(
                error instanceof Error
                    ? error.message
                    : "Failed to load exchange rates",
            );

        } finally {
            setLoadingRates(false);
        }
    }


    /*
     * CREATE EXCHANGE RATE
     */
    async function handleSubmit(
        event: React.SubmitEvent<HTMLFormElement>,
    ) {
        event.preventDefault();

        setError("");
        setSuccess("");

        if (!effectiveFrom) {
            setError(
                "Please select an effective date.",
            );
            return;
        }

        if (!currency) {
            setError(
                "Please enter a currency.",
            );
            return;
        }

        if (!rateToLkr) {
            setError(
                "Please enter the exchange rate.",
            );
            return;
        }

        if (!source.trim()) {
            setError(
                "Please enter the source.",
            );
            return;
        }

        try {
            setSubmitting(true);

            const token =
                localStorage.getItem("token");

            const response =
                await fetch(
                    "http://localhost:3001/api/exchange-rates",
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json",

                            ...(token
                                ? {
                                    Authorization:
                                        `Bearer ${token}`,
                                }
                                : {}),
                        },

                        body: JSON.stringify({
                            effectiveFrom,
                            currency:
                                currency.toUpperCase(),
                            rateToLkr,
                            source:
                                source.trim(),
                        }),
                    },
                );

            const data =
                await response.json();

            if (!response.ok) {
                throw new Error(
                    data?.message ||
                    "Failed to create exchange rate",
                );
            }

            setSuccess(
                "Exchange rate added successfully.",
            );

            /*
             * Clear form
             */
            setEffectiveFrom("");
            setCurrency("USD");
            setRateToLkr("");
            setSource("");

            /*
             * Refresh list
             */
            await loadExchangeRates();

        } catch (error) {

            setError(
                error instanceof Error
                    ? error.message
                    : "Failed to create exchange rate",
            );

        } finally {
            setSubmitting(false);
        }
    }


    /*
     * LOADING AUTH
     */
    if (isLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                Loading...
            </div>
        );
    }


    return (
        <div className="flex min-h-screen bg-gray-50">

            <SidebarFinance
                activeItem="Exchange Rates"
            />

            <main className="flex-1 p-8">

                <div className="mx-auto max-w-6xl">

                    {/* HEADER */}

                    <h1 className="text-3xl font-bold text-gray-900">
                        Exchange Rates
                    </h1>

                    <p className="mt-2 text-gray-500">
                        Manage currency exchange rates used
                        to convert booking amounts to LKR.
                    </p>


                    {/* FORM CARD */}

                    <div className="mt-8 rounded-xl bg-white p-6 shadow-sm">

                        <h2 className="text-xl font-semibold text-gray-900">
                            Add Exchange Rate
                        </h2>

                        <p className="mt-1 text-sm text-gray-500">
                            Add the rate that should be used
                            from the selected effective date.
                        </p>


                        {/* ERROR */}

                        {error && (
                            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                                {error}
                            </div>
                        )}


                        {/* SUCCESS */}

                        {success && (
                            <div className="mt-4 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">
                                {success}
                            </div>
                        )}


                        <form
                            onSubmit={handleSubmit}
                            className="mt-6"
                        >

                            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">

                                {/* EFFECTIVE DATE */}

                                <div>
                                    <label
                                        htmlFor="effectiveFrom"
                                        className="mb-2 block text-sm font-medium text-gray-700"
                                    >
                                        Effective From
                                    </label>

                                    <input
                                        id="effectiveFrom"
                                        type="date"
                                        value={effectiveFrom}
                                        onChange={(event) =>
                                            setEffectiveFrom(
                                                event.target.value,
                                            )
                                        }
                                        className="w-full rounded-lg border border-gray-300 px-4 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                    />
                                </div>


                                {/* CURRENCY */}

                                <div>
                                    <label
                                        htmlFor="currency"
                                        className="mb-2 block text-sm font-medium text-gray-700"
                                    >
                                        Currency
                                    </label>

                                    <input
                                        id="currency"
                                        type="text"
                                        maxLength={3}
                                        value={currency}
                                        onChange={(event) =>
                                            setCurrency(
                                                event.target.value
                                                    .toUpperCase(),
                                            )
                                        }
                                        placeholder="USD"
                                        className="w-full rounded-lg border border-gray-300 px-4 py-2.5 uppercase outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                    />
                                </div>


                                {/* RATE */}

                                <div>
                                    <label
                                        htmlFor="rateToLkr"
                                        className="mb-2 block text-sm font-medium text-gray-700"
                                    >
                                        Rate to LKR
                                    </label>

                                    <input
                                        id="rateToLkr"
                                        type="text"
                                        value={rateToLkr}
                                        onChange={(event) =>
                                            setRateToLkr(
                                                event.target.value,
                                            )
                                        }
                                        placeholder="318.40"
                                        className="w-full rounded-lg border border-gray-300 px-4 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                    />

                                    <p className="mt-1 text-xs text-gray-500">
                                        Example: 1 USD = 318.40 LKR
                                    </p>
                                </div>


                                {/* SOURCE */}

                                <div>
                                    <label
                                        htmlFor="source"
                                        className="mb-2 block text-sm font-medium text-gray-700"
                                    >
                                        Source
                                    </label>

                                    <input
                                        id="source"
                                        type="text"
                                        value={source}
                                        onChange={(event) =>
                                            setSource(
                                                event.target.value,
                                            )
                                        }
                                        placeholder="CBSL weekly"
                                        className="w-full rounded-lg border border-gray-300 px-4 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                    />
                                </div>

                            </div>


                            {/* SUBMIT */}

                            <div className="mt-6 flex justify-end">

                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="rounded-lg bg-blue-600 px-6 py-2.5 font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {submitting
                                        ? "Adding..."
                                        : "Add Exchange Rate"}
                                </button>

                            </div>

                        </form>

                    </div>


                    {/* EXISTING RATES */}

                    <div className="mt-8 rounded-xl bg-white shadow-sm">

                        <div className="border-b border-gray-200 p-6">

                            <h2 className="text-xl font-semibold text-gray-900">
                                Exchange Rate History
                            </h2>

                            <p className="mt-1 text-sm text-gray-500">
                                Previously added exchange rates.
                            </p>

                        </div>


                        {loadingRates ? (

                            <div className="p-8 text-center text-gray-500">
                                Loading exchange rates...
                            </div>

                        ) : rates.length === 0 ? (

                            <div className="p-8 text-center text-gray-500">
                                No exchange rates found.
                            </div>

                        ) : (

                            <div className="overflow-x-auto">

                                <table className="w-full">

                                    <thead className="bg-gray-50">

                                        <tr>

                                            <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                                                Effective From
                                            </th>

                                            <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                                                Currency
                                            </th>

                                            <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                                                Rate to LKR
                                            </th>

                                            <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                                                Source
                                            </th>

                                        </tr>

                                    </thead>

                                    <tbody className="divide-y divide-gray-200">

                                        {rates.map((rate) => (

                                            <tr
                                                key={rate.id}
                                                className="hover:bg-gray-50"
                                            >

                                                <td className="px-6 py-4 text-sm text-gray-900">
                                                    {rate.effective_from}
                                                </td>

                                                <td className="px-6 py-4">

                                                    <span className="rounded-md bg-gray-100 px-2 py-1 text-sm font-semibold text-gray-700">
                                                        {rate.currency}
                                                    </span>

                                                </td>

                                                <td className="px-6 py-4 text-sm font-medium text-gray-900">
                                                    {rate.rate_to_lkr}
                                                </td>

                                                <td className="px-6 py-4 text-sm text-gray-500">
                                                    {rate.source}
                                                </td>

                                            </tr>

                                        ))}

                                    </tbody>

                                </table>

                            </div>

                        )}

                    </div>

                </div>

            </main>

        </div>
    );
}

export default ExchangeRatePage;