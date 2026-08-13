import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useAuthorizationCheck } from "../../authorization/AuthorizationCheck";
import SidebarAdmin from "../../component/layout/sidebar-admin";
import Button from "../../component/ui/Button";
import api from "../../services/api";

interface ImportError {
    row: number;
    reason: string;
}

interface ImportResult {
    accepted: number;
    rejected: number;
    errors: ImportError[];
}

function Booking_infomation() {
    const { isLoading } = useAuth();

    const {
        financeAuthorization,
    } = useAuthorizationCheck();

    const [file, setFile] =
        useState<File | null>(null);

    const [loading, setLoading] =
        useState(false);

    const [error, setError] =
        useState("");

    const [result, setResult] =
        useState<ImportResult | null>(null);

    useEffect(() => {
        if (!isLoading) {
            financeAuthorization();
        }
    }, [isLoading]);

    const handleFileChange = (
        event: React.ChangeEvent<HTMLInputElement>
    ) => {
        const selectedFile =
            event.target.files?.[0] ?? null;

        setFile(selectedFile);
        setError("");
        setResult(null);
    };

    const handleImport = async () => {
        if (!file) {
            setError(
                "Please select a CSV file."
            );
            return;
        }

        if (!file.name.endsWith(".csv")) {
            setError(
                "Please select a CSV file."
            );
            return;
        }

        try {
            setLoading(true);
            setError("");
            setResult(null);

            const formData = new FormData();

            formData.append(
                "file",
                file
            );

            const token =
                localStorage.getItem("token");

            const response =
                await api.post(
                    "/bookings/import",
                    formData,
                    {
                        headers: {
                            Authorization:
                                `Bearer ${token}`,
                        },
                    }
                );

            setResult(
                response.data.data
            );

        } catch (error: any) {
            console.error(
                "Booking import error:",
                error
            );

            setError(
                error?.response?.data?.error
                    ?.message ||
                "Failed to import bookings."
            );

        } finally {
            setLoading(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                Loading...
            </div>
        );
    }

    return (
        <div className="flex min-h-screen bg-gray-50">

            <SidebarAdmin
                activeItem="Booking Imports"
            />

            <main className="flex-1 p-8">

                {/* Header */}

                <div className="mb-8">

                    <h1 className="text-3xl font-bold text-gray-900">
                        Booking Imports
                    </h1>

                    <p className="mt-2 text-sm text-gray-500">
                        Import booking information
                        from a CSV file.
                    </p>

                </div>


                {/* Upload */}

                <div className="rounded-xl border border-gray-200 bg-white p-6">

                    <h2 className="text-lg font-semibold text-gray-900">
                        Upload Bookings
                    </h2>

                    <p className="mt-1 text-sm text-gray-500">
                        Select a CSV file containing
                        your booking data.
                    </p>


                    <div className="mt-6">

                        <input
                            type="file"
                            accept=".csv"
                            onChange={
                                handleFileChange
                            }
                            className="block w-full rounded-lg border border-gray-300 p-3 text-sm"
                        />

                    </div>


                    {/* Selected file */}

                    {file && (
                        <div className="mt-4 rounded-lg bg-gray-50 p-3 text-sm">

                            Selected file:

                            <span className="ml-2 font-medium">
                                {file.name}
                            </span>

                        </div>
                    )}


                    {/* Error */}

                    {error && (
                        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                            {error}
                        </div>
                    )}


                    {/* Import button */}

                    <div className="mt-6">

                        <Button
                            type="button"
                            variant="primary"
                            onClick={
                                handleImport
                            }
                            disabled={loading}
                        >
                            {loading
                                ? "Importing..."
                                : "Import Bookings"}
                        </Button>

                    </div>

                </div>


                {/* Import result */}

                {result && (
                    <div className="mt-6 rounded-xl border border-gray-200 bg-white p-6">

                        <h2 className="text-lg font-semibold text-gray-900">
                            Import Result
                        </h2>


                        <div className="mt-5 grid grid-cols-2 gap-4">

                            <div className="rounded-lg bg-green-50 p-4">

                                <p className="text-sm text-gray-500">
                                    Accepted
                                </p>

                                <p className="mt-1 text-2xl font-bold text-green-600">
                                    {result.accepted}
                                </p>

                            </div>


                            <div className="rounded-lg bg-red-50 p-4">

                                <p className="text-sm text-gray-500">
                                    Rejected
                                </p>

                                <p className="mt-1 text-2xl font-bold text-red-600">
                                    {result.rejected}
                                </p>

                            </div>

                        </div>


                        {/* Rejected rows */}

                        {result.errors.length > 0 && (
                            <div className="mt-6">

                                <h3 className="mb-3 font-semibold text-gray-900">
                                    Rejected Rows
                                </h3>

                                <div className="overflow-hidden rounded-lg border border-gray-200">

                                    <table className="w-full text-left">

                                        <thead className="bg-gray-50">

                                            <tr>

                                                <th className="px-4 py-3 text-xs font-semibold uppercase text-gray-500">
                                                    Row
                                                </th>

                                                <th className="px-4 py-3 text-xs font-semibold uppercase text-gray-500">
                                                    Reason
                                                </th>

                                            </tr>

                                        </thead>

                                        <tbody className="divide-y divide-gray-200">

                                            {result.errors.map(
                                                (
                                                    item,
                                                    index
                                                ) => (

                                                    <tr
                                                        key={
                                                            index
                                                        }
                                                    >

                                                        <td className="px-4 py-3 text-sm">
                                                            {
                                                                item.row
                                                            }
                                                        </td>

                                                        <td className="px-4 py-3 text-sm text-red-600">
                                                            {
                                                                item.reason
                                                            }
                                                        </td>

                                                    </tr>

                                                )
                                            )}

                                        </tbody>

                                    </table>

                                </div>

                            </div>
                        )}

                    </div>
                )}

            </main>

        </div>
    );
}

export default Booking_infomation;