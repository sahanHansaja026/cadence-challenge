import { useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import {
    useAuthorizationCheck,
} from "../../authorization/AuthorizationCheck";
import { useNavigate } from "react-router-dom";
import SidebarAdmin from "../../component/layout/sidebar-admin";

function Admin_dashboard() {
    const { user, isLoading } = useAuth();

    const navigate = useNavigate();

    const { adminAuthorization } =
        useAuthorizationCheck();

    // Authorization
    useEffect(() => {
        if (!isLoading) {
            adminAuthorization();
        }
    }, [isLoading]);

    if (isLoading) {
        return <div>Loading...</div>;
    }

    return (
        <div className="flex min-h-screen bg-gray-50">

            {/* Sidebar */}
            <SidebarAdmin activeItem="Dashboard" />

            {/* Main Content */}
            <main className="flex-1 p-8">

                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">
                        Dashboard
                    </h1>

                    <p className="mt-2 text-gray-500">
                        Welcome back, {user?.email}
                    </p>
                </div>

                {/* Company Information */}
                <div className="mb-8 rounded-xl border border-gray-200 bg-white p-6">

                    <h2 className="mb-5 text-lg font-semibold text-gray-900">
                        Company Information
                    </h2>

                    <div className="grid grid-cols-1 gap-5 md:grid-cols-3">

                        <div>
                            <p className="text-sm text-gray-500">
                                Email
                            </p>

                            <p className="mt-1 font-medium text-gray-900">
                                {user?.email}
                            </p>
                        </div>

                        <div>
                            <p className="text-sm text-gray-500">
                                Company
                            </p>

                            <p className="mt-1 font-medium text-gray-900">
                                {user?.companyId}
                            </p>
                        </div>

                        <div>
                            <p className="text-sm text-gray-500">
                                Role
                            </p>

                            <p className="mt-1 font-medium text-gray-900">
                                {user?.role}
                            </p>
                        </div>

                    </div>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">

                    <div className="rounded-xl border border-gray-200 bg-white p-6">
                        <p className="text-sm text-gray-500">
                            Total Users
                        </p>

                        <p className="mt-2 text-3xl font-bold text-gray-900">
                            0
                        </p>
                    </div>

                    <div className="rounded-xl border border-gray-200 bg-white p-6">
                        <p className="text-sm text-gray-500">
                            Total Bookings
                        </p>

                        <p className="mt-2 text-3xl font-bold text-gray-900">
                            0
                        </p>
                    </div>

                    <div className="rounded-xl border border-gray-200 bg-white p-6">
                        <p className="text-sm text-gray-500">
                            Pending Payouts
                        </p>

                        <p className="mt-2 text-3xl font-bold text-gray-900">
                            0
                        </p>
                    </div>

                    <div className="rounded-xl border border-gray-200 bg-white p-6">
                        <p className="text-sm text-gray-500">
                            Commission Rules
                        </p>

                        <p className="mt-2 text-3xl font-bold text-gray-900">
                            0
                        </p>
                    </div>

                </div>

            </main>
        </div>
    );
}

export default Admin_dashboard;