import React from "react";
import { useNavigate } from "react-router-dom";

interface SidebarProps {
    activeItem?: string;
    onNavigate?: (item: string) => void;
}

const menuItems = [
    "Dashboard",
    "User Management",
    "view users",
    "Booking Imports",
    "Booking Details",
    "Commission Rules",
    "Payout Runs",
    "Refunds",
    "Reports & Statements",

];

const routes: Record<string, string> = {
    "Dashboard": "/admin/dashboard",
    "User Management": "/usermangemtn",
    "view users": "/viewusers",
    "Booking Imports": "/bookinginfo",
    "Booking Details": "/viewbookings",
    "Commission Rules": "/commtionrule",
    "Payout Runs": "/payoutrun",
    "Refunds": "/refundadmin",
    "Reports & Statements": "/reportadmin",

};

const SidebarAdmin: React.FC<SidebarProps> = ({
    activeItem = "Dashboard",
    onNavigate,
}) => {
    const navigate = useNavigate();

    const handleNavigation = (item: string) => {
        onNavigate?.(item);

        const path = routes[item];

        if (path) {
            navigate(path);
        }
    };

    return (
        <aside className="flex h-screen w-64 flex-col border-r border-gray-200 bg-white">

            {/* Header */}
            <div className="border-b border-gray-200 px-6 py-6">
                <h1 className="text-xl font-bold tracking-tight text-gray-900">
                    Cadence
                </h1>

                <p className="mt-1 text-sm text-gray-500">
                    Company Admin
                </p>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-3 py-6">

                <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
                    Management
                </p>

                <div className="space-y-1">

                    {menuItems.map((item) => {
                        const isActive = activeItem === item;

                        return (
                            <button
                                key={item}
                                type="button"
                                onClick={() =>
                                    handleNavigation(item)
                                }
                                className={`w-full rounded-lg px-3 py-2.5 text-left text-sm font-medium transition ${isActive
                                    ? "bg-gray-900 text-white"
                                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                                    }`}
                            >
                                {item}
                            </button>
                        );
                    })}

                </div>
            </nav>

            {/* Bottom */}
            <div className="border-t border-gray-200 p-3">

                <button
                    type="button"
                    onClick={() =>
                        navigate("/settings")
                    }
                    className="w-full rounded-lg px-3 py-2.5 text-left text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                >
                    Settings
                </button>

                <button
                    type="button"
                    onClick={() => navigate("/")}
                    className="mt-1 w-full rounded-lg px-3 py-2.5 text-left text-sm font-medium text-gray-600 hover:bg-red-50 hover:text-red-600"
                >
                    Logout
                </button>

            </div>
        </aside>
    );
};

export default SidebarAdmin;