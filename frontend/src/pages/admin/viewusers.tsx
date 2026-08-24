import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useAuthorizationCheck } from "../../authorization/AuthorizationCheck";
import SidebarAdmin from "../../component/layout/sidebar-admin";
import Button from "../../component/ui/Button";
import api from "../../services/api";
import { useNavigate } from "react-router-dom";

type UserRole =
    | "COMPANY_ADMIN"
    | "FINANCE"
    | "AGENT";

interface User {
    id: string;
    email: string;
    role: UserRole;
    company_id: string;
    created_at: string;
}

function ViewUsers() {
    const {
        isLoading,
    } = useAuth();
    const navigate = useNavigate();
    const {
        adminAuthorization,
    } = useAuthorizationCheck();

    const [users, setUsers] =
        useState<User[]>([]);

    const [loadingUsers, setLoadingUsers] =
        useState(false);

    const [error, setError] =
        useState("");

    // Admin authorization
    useEffect(() => {
        if (!isLoading) {
            adminAuthorization();
        }
    }, [isLoading]);

    // Get users
    useEffect(() => {
        if (!isLoading) {
            fetchUsers();
        }
    }, [isLoading]);

    const fetchUsers = async () => {
        try {
            setLoadingUsers(true);
            setError("");

            const token =
                localStorage.getItem("token");

            const response = await api.get(
                "/users",
                {
                    headers: {
                        Authorization:
                            `Bearer ${token}`,
                    },
                }
            );

            setUsers(
                response.data.data.users
            );

        } catch (error: any) {
            console.error(
                "Fetch users error:",
                error
            );

            setError(
                error?.response?.data?.error
                    ?.message ||
                "Failed to load users."
            );

        } finally {
            setLoadingUsers(false);
        }
    };

    const handleEdit = (userId: string) => {
        navigate(`/edituser/${userId}`);
    };

    const handleDelete = async (
        userId: string
    ) => {

        const confirmed =
            window.confirm(
                "Are you sure you want to delete this user?"
            );

        if (!confirmed) {
            return;
        }

        try {
            const token =
                localStorage.getItem("token");

            await api.delete(
                `/users/${userId}`,
                {
                    headers: {
                        Authorization:
                            `Bearer ${token}`,
                    },
                }
            );

            // Remove deleted user
            setUsers(
                (currentUsers) =>
                    currentUsers.filter(
                        (user) =>
                            user.id !== userId
                    )
            );

        } catch (error: any) {
            console.error(
                "Delete user error:",
                error
            );

            setError(
                error?.response?.data?.error
                    ?.message ||
                "Failed to delete user."
            );
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
                activeItem="view users"
            />

            {/* Main */}
            <main className="flex-1 p-8">

                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">
                        Users
                    </h1>

                    <p className="mt-2 text-sm text-gray-500">
                        View and manage users
                        in your company.
                    </p>
                </div>

                {/* Error */}
                {error && (
                    <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
                        {error}
                    </div>
                )}

                {/* Table */}
                <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">

                    {loadingUsers ? (
                        <div className="p-6 text-sm text-gray-500">
                            Loading users...
                        </div>
                    ) : users.length === 0 ? (
                        <div className="p-6 text-sm text-gray-500">
                            No users found.
                        </div>
                    ) : (
                        <div className="overflow-x-auto">

                            <table className="w-full text-left">

                                <thead className="border-b border-gray-200 bg-gray-50">

                                    <tr>

                                        <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-gray-500">
                                            Email
                                        </th>

                                        <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-gray-500">
                                            Role
                                        </th>

                                        <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-gray-500">
                                            Company
                                        </th>

                                        <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-gray-500">
                                            Actions
                                        </th>

                                    </tr>

                                </thead>

                                <tbody className="divide-y divide-gray-200">

                                    {users.map(
                                        (companyUser) => (
                                            <tr
                                                key={
                                                    companyUser.id
                                                }
                                                className="hover:bg-gray-50"
                                            >

                                                <td className="px-6 py-4 text-sm font-medium text-gray-900">
                                                    {
                                                        companyUser.email
                                                    }
                                                </td>

                                                <td className="px-6 py-4">

                                                    <span className="rounded-md bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700">
                                                        {
                                                            companyUser.role
                                                        }
                                                    </span>

                                                </td>

                                                <td className="px-6 py-4 text-sm text-gray-500">
                                                    {
                                                        companyUser.company_id
                                                    }
                                                </td>

                                                <td className="px-6 py-4">

                                                    {companyUser.role === "COMPANY_ADMIN" ? (
                                                        <span className="text-sm text-gray-400">
                                                            Not available
                                                        </span>
                                                    ) : (
                                                        <div className="flex gap-2">

                                                            <Button
                                                                type="button"
                                                                variant="secondary"
                                                                onClick={() =>
                                                                    handleEdit(companyUser.id)
                                                                }
                                                            >
                                                                Edit
                                                            </Button>

                                                            <Button
                                                                type="button"
                                                                variant="danger"
                                                                onClick={() =>
                                                                    handleDelete(
                                                                        companyUser.id
                                                                    )
                                                                }
                                                            >
                                                                Delete
                                                            </Button>

                                                        </div>
                                                    )}

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

export default ViewUsers;