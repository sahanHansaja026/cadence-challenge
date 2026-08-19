import { useState } from "react";
import { useNavigate } from "react-router-dom";

import SidebarAdmin from "../../component/layout/sidebar-admin";
import api from "../../services/api";
import Button from "../../component/ui/Button";
import Input from "../../component/ui/input";


function Settings() {

    const navigate = useNavigate();

    const [currentPassword, setCurrentPassword] =
        useState("");

    const [newPassword, setNewPassword] =
        useState("");

    const [confirmPassword, setConfirmPassword] =
        useState("");

    const [loading, setLoading] =
        useState(false);

    const [error, setError] =
        useState("");

    const [success, setSuccess] =
        useState("");


    async function handleSubmit(
        event: React.FormEvent<HTMLFormElement>,
    ) {

        event.preventDefault();

        setError("");
        setSuccess("");


        /*
         * Check passwords before sending
         * the request to the backend.
         */
        if (newPassword !== confirmPassword) {

            setError(
                "New password and confirmation password do not match.",
            );

            return;
        }


        if (newPassword.length < 8) {

            setError(
                "New password must be at least 8 characters.",
            );

            return;
        }


        try {

            setLoading(true);


            await api.patch(
                "/password/me/password",
                {
                    currentPassword,
                    newPassword,
                },
            );


            setSuccess(
                "Password changed successfully.",
            );


            /*
             * Clear the password fields.
             */
            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");


        } catch (err: any) {

            console.error(
                "Change password error:",
                err,
            );


            setError(
                err?.response?.data?.error?.message ||
                "Failed to change password.",
            );

        } finally {

            setLoading(false);

        }
    }


    return (
        <div className="flex min-h-screen bg-gray-50">

            <SidebarAdmin activeItem="Settings" />


            <main className="flex-1 p-8">

                {/* Header */}

                <div className="mb-8">

                    <h1 className="text-3xl font-bold text-gray-900">
                        Settings
                    </h1>

                    <p className="mt-2 text-gray-500">
                        Manage your account settings.
                    </p>

                </div>


                {/* Change Password */}

                <div className="max-w-2xl rounded-xl border border-gray-200 bg-white p-6">

                    <div className="mb-6">

                        <h2 className="text-xl font-semibold text-gray-900">
                            Change Password
                        </h2>

                        <p className="mt-1 text-sm text-gray-500">
                            Update your account password.
                        </p>

                    </div>


                    {error && (

                        <div className="mb-5 rounded-lg border border-red-200 bg-red-50 p-4">

                            <p className="text-sm text-red-700">
                                {error}
                            </p>

                        </div>

                    )}


                    {success && (

                        <div className="mb-5 rounded-lg border border-green-200 bg-green-50 p-4">

                            <p className="text-sm text-green-700">
                                {success}
                            </p>

                        </div>

                    )}


                    <form
                        onSubmit={handleSubmit}
                        className="space-y-5"
                    >

                        {/* Current Password */}

                        <div>

                            <label
                                htmlFor="currentPassword"
                                className="mb-2 block text-sm font-medium text-gray-700"
                            >
                                Current Password
                            </label>

                            <Input
                                id="currentPassword"
                                type="password"
                                value={currentPassword}
                                onChange={(event) =>
                                    setCurrentPassword(
                                        event.target.value,
                                    )
                                }
                                required
                                autoComplete="current-password"
                                className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none transition focus:border-gray-500 focus:ring-2 focus:ring-gray-200"
                                placeholder="Enter current password"
                            />

                        </div>


                        {/* New Password */}

                        <div>

                            <label
                                htmlFor="newPassword"
                                className="mb-2 block text-sm font-medium text-gray-700"
                            >
                                New Password
                            </label>

                            <Input
                                id="newPassword"
                                type="password"
                                value={newPassword}
                                onChange={(event) =>
                                    setNewPassword(
                                        event.target.value,
                                    )
                                }
                                required
                                minLength={8}
                                autoComplete="new-password"
                                className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none transition focus:border-gray-500 focus:ring-2 focus:ring-gray-200"
                                placeholder="Enter new password"
                            />

                            <p className="mt-1 text-xs text-gray-500">
                                Minimum 8 characters.
                            </p>

                        </div>


                        {/* Confirm Password */}

                        <div>

                            <label
                                htmlFor="confirmPassword"
                                className="mb-2 block text-sm font-medium text-gray-700"
                            >
                                Confirm New Password
                            </label>

                            <Input
                                id="confirmPassword"
                                type="password"
                                value={confirmPassword}
                                onChange={(event) =>
                                    setConfirmPassword(
                                        event.target.value,
                                    )
                                }
                                required
                                minLength={8}
                                autoComplete="new-password"
                                className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none transition focus:border-gray-500 focus:ring-2 focus:ring-gray-200"
                                placeholder="Confirm new password"
                            />

                        </div>


                        {/* Actions */}

                        <div className="flex items-center gap-3 pt-2">

                            <Button
                                type="submit"
                                disabled={loading}
                                variant="primary"
                            >
                                {loading
                                    ? "Changing..."
                                    : "Change Password"}
                            </Button>


                            <button
                                type="button"
                                onClick={() =>
                                    navigate("/admin/dashboard")
                                }
                            
                            >
                                Cancel
                            </button>

                        </div>

                    </form>

                </div>

            </main>

        </div>
    );
}


export default Settings;

