import {
    useEffect,
    useState,
} from "react";

import {
    useNavigate,
    useParams,
} from "react-router-dom";

import {
    useAuth,
} from "../../context/AuthContext";

import {
    useAuthorizationCheck,
} from "../../authorization/AuthorizationCheck";

import SidebarAdmin from "../../component/layout/sidebar-admin";
import Input from "../../component/ui/input";
import Button from "../../component/ui/Button";
import api from "../../services/api";

type UserRole = "FINANCE" | "AGENT";

interface User {
    id: string;
    email: string;
    role: UserRole;
    company_id: string;
    created_at: string;
}

function EditUser() {

    const {
        isLoading,
    } = useAuth();

    const {
        adminAuthorization,
    } = useAuthorizationCheck();

    const {
        id: userId,
    } = useParams<{ id: string }>();

    const navigate = useNavigate();

    const [user, setUser] =
        useState<User | null>(null);

    const [email, setEmail] =
        useState("");

    const [role, setRole] =
        useState<UserRole>("AGENT");

    const [password, setPassword] =
        useState("");

    const [loading, setLoading] =
        useState(true);

    const [saving, setSaving] =
        useState(false);

    const [error, setError] =
        useState("");

    const [message, setMessage] =
        useState("");

    /*
     * Check admin authorization
     */
    useEffect(() => {

        if (!isLoading) {
            adminAuthorization();
        }

    }, [isLoading]);


    /*
     * Get user by ID
     */
    useEffect(() => {

        if (!isLoading && userId) {
            fetchUser();
        }

    }, [isLoading, userId]);


    const fetchUser = async () => {

        try {

            setLoading(true);
            setError("");

            const token =
                localStorage.getItem("token");

            const response =
                await api.get(
                    `/users/${userId}`,
                    {
                        headers: {
                            Authorization:
                                `Bearer ${token}`,
                        },
                    }
                );

            const fetchedUser =
                response.data.data.user;

            setUser(fetchedUser);

            setEmail(
                fetchedUser.email
            );

            setRole(
                fetchedUser.role
            );

        } catch (error: any) {

            console.error(
                "Get user error:",
                error
            );

            setError(
                error?.response?.data?.error
                    ?.message ||
                "Failed to load user."
            );

        } finally {

            setLoading(false);

        }
    };


    /*
     * Update user
     */
    const handleSubmit = async (
        e: React.FormEvent
    ) => {

        e.preventDefault();

        setError("");
        setMessage("");

        if (!email.trim()) {
            setError(
                "Email is required."
            );
            return;
        }

        if (
            password &&
            password.length < 8
        ) {
            setError(
                "Password must be at least 8 characters."
            );
            return;
        }

        try {

            setSaving(true);

            const token =
                localStorage.getItem("token");

            const body: {
                email: string;
                role: UserRole;
                password?: string;
            } = {
                email: email.trim(),
                role,
            };

            /*
             * Only send password when
             * admin entered a new password.
             */
            if (password.trim()) {
                body.password = password;
            }

            await api.put(
                `/users/${userId}`,
                body,
                {
                    headers: {
                        Authorization:
                            `Bearer ${token}`,
                    },
                }
            );

            setMessage(
                "User updated successfully."
            );

            setPassword("");

            /*
             * Go back to users page
             * after successful update.
             */
            setTimeout(() => {
                navigate("/viewusers");
            }, 1000);

        } catch (error: any) {

            console.error(
                "Update user error:",
                error
            );

            setError(
                error?.response?.data?.error
                    ?.message ||
                "Failed to update user."
            );

        } finally {

            setSaving(false);

        }
    };


    if (isLoading || loading) {
        return (
            <div className="p-8">
                Loading user...
            </div>
        );
    }


    if (!user) {
        return (
            <div className="flex min-h-screen bg-gray-50">

                <SidebarAdmin
                    activeItem="view users"
                />

                <main className="flex-1 p-8">

                    <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
                        {error ||
                            "User not found."}
                    </div>

                    <div className="mt-5">

                        <Button
                            type="button"
                            variant="secondary"
                            onClick={() =>
                                navigate(
                                    "/admin/users"
                                )
                            }
                        >
                            Back to Users
                        </Button>

                    </div>

                </main>

            </div>
        );
    }


    return (
        <div className="flex min-h-screen bg-gray-50">

            {/* Sidebar */}

            <SidebarAdmin
                activeItem="view users"
            />


            {/* Main */}

            <main className="flex-1 p-8">

                <div className="mb-8">

                    <h1 className="text-3xl font-bold text-gray-900">
                        Edit User
                    </h1>

                    <p className="mt-2 text-sm text-gray-500">
                        Update the user's account
                        information.
                    </p>

                </div>


                {/* Success */}

                {message && (
                    <div className="mb-6 rounded-lg border border-green-200 bg-green-50 p-4 text-sm font-medium text-green-700">
                        {message}
                    </div>
                )}


                {/* Error */}

                {error && (
                    <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
                        {error}
                    </div>
                )}


                {/* Form */}

                <div className="max-w-2xl rounded-xl border border-gray-200 bg-white p-6">

                    <form
                        onSubmit={handleSubmit}
                        className="space-y-6"
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
                                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-3 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
                            >

                                <option value="AGENT">
                                    Agent
                                </option>

                                <option value="FINANCE">
                                    Finance
                                </option>

                            </select>

                        </div>


                        {/* Password */}

                        <Input
                            label="New Password"
                            type="password"
                            placeholder="Leave empty to keep current password"
                            value={password}
                            onChange={(e) =>
                                setPassword(
                                    e.target.value
                                )
                            }
                        />


                        {/* Company */}

                        <div>

                            <label className="mb-2 block text-sm font-medium text-gray-900">
                                Company
                            </label>

                            <input
                                type="text"
                                value={user.company_id}
                                disabled
                                className="w-full rounded-lg border border-gray-200 bg-gray-100 px-3 py-3 text-sm text-gray-500"
                            />

                        </div>


                        {/* Buttons */}

                        <div className="flex gap-3 pt-2">

                            <Button
                                type="submit"
                                variant="primary"
                                disabled={saving}
                            >
                                {saving
                                    ? "Saving..."
                                    : "Save Changes"}
                            </Button>


                            <Button
                                type="button"
                                variant="secondary"
                                onClick={() =>
                                    navigate(
                                        "/admin/users"
                                    )
                                }
                            >
                                Cancel
                            </Button>

                        </div>

                    </form>

                </div>

            </main>

        </div>
    );
}

export default EditUser;