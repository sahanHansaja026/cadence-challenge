import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useAuthorizationCheck } from "../../authorization/AuthorizationCheck";
import Input from "../../component/ui/input";
import Button from "../../component/ui/Button";
import SidebarAdmin from "../../component/layout/sidebar-admin";
import api from "../../services/api";

type UserRole = "FINANCE" | "AGENT";

function UserManagement() {
    const {
        isLoading,
    } = useAuth();

    const {
        adminAuthorization,
    } = useAuthorizationCheck();

    const [email, setEmail] =
        useState("");

    const [password, setPassword] =
        useState("");

    const [role, setRole] =
        useState<UserRole>("AGENT");

    const [creating, setCreating] =
        useState(false);

    const [message, setMessage] =
        useState("");

    const [error, setError] =
        useState("");

    // Admin authorization
    useEffect(() => {
        if (!isLoading) {
            adminAuthorization();
        }
    }, [isLoading]);

    // Create Finance / Agent user
    const createUser = async (
        e: React.FormEvent
    ) => {
        e.preventDefault();

        setMessage("");
        setError("");

        if (!email.trim()) {
            setError(
                "Email is required."
            );
            return;
        }

        if (!password.trim()) {
            setError(
                "Password is required."
            );
            return;
        }

        if (password.length < 8) {
            setError(
                "Password must be at least 8 characters."
            );
            return;
        }

        try {
            setCreating(true);

            const token =
                localStorage.getItem("token");

            await api.post(
                "/users",
                {
                    email: email.trim(),
                    password,
                    role,
                },
                {
                    headers: {
                        Authorization:
                            `Bearer ${token}`,
                    },
                }
            );

            setMessage(
                `${role} user created successfully.`
            );

            // Clear form
            setEmail("");
            setPassword("");
            setRole("AGENT");

        } catch (error: any) {
            console.error(
                "Create user error:",
                error
            );

            setError(
                error?.response?.data?.error
                    ?.message ||
                "Failed to create user."
            );

        } finally {
            setCreating(false);
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
                activeItem="User Management"
            />

            {/* Main */}
            <main className="flex-1 p-8">

                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">
                        User Management
                    </h1>

                    <p className="mt-2 text-sm text-gray-500">
                        Create Finance or Agent users
                        within your company.
                    </p>
                </div>

                {/* Success message */}
                {message && (
                    <div className="mb-6 rounded-lg border border-green-200 bg-green-50 p-4 text-sm font-medium text-green-700">
                        {message}
                    </div>
                )}

                {/* Error message */}
                {error && (
                    <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
                        {error}
                    </div>
                )}

                {/* Create User */}
                <div className="max-w-3xl rounded-xl border border-gray-200 bg-white p-6">

                    <h2 className="mb-1 text-xl font-semibold text-gray-900">
                        Create User
                    </h2>

                    <p className="mb-6 text-sm text-gray-500">
                        Add a Finance or Agent user
                        to your company.
                    </p>

                    <form
                        onSubmit={createUser}
                        className="space-y-5"
                    >

                        {/* Email */}
                        <Input
                            label="Email"
                            type="email"
                            placeholder="user@company.com"
                            value={email}
                            required
                            onChange={(e) =>
                                setEmail(
                                    e.target.value
                                )
                            }
                        />

                        {/* Password */}
                        <Input
                            label="Password"
                            type="password"
                            placeholder="Minimum 8 characters"
                            value={password}
                            required
                            onChange={(e) =>
                                setPassword(
                                    e.target.value
                                )
                            }
                        />

                        {/* Role */}
                        <div>
                            <label className="mb-2 block text-sm font-medium text-gray-900">
                                Role
                            </label>

                            <select
                                value={role}
                                onChange={(e) =>
                                    setRole(
                                        e.target.value as UserRole
                                    )
                                }
                                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-3 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
                            >
                                <option value="AGENT">
                                    Agent
                                </option>

                                <option value="FINANCE">
                                    Finance
                                </option>
                            </select>
                        </div>

                        {/* Create button */}
                        <Button
                            type="submit"
                            variant="primary"
                            disabled={creating}
                        >
                            {creating
                                ? "Creating..."
                                : "Create User"}
                        </Button>

                    </form>
                </div>

            </main>
        </div>
    );
}

export default UserManagement;