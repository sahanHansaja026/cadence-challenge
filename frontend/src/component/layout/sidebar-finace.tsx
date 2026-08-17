import React from "react";
import { useNavigate } from "react-router-dom";

interface SidebarFinanceProps {
    activeItem?: string;
}

const menuItems = [
    {
        label: "Dashboard",
        path: "/finance/dashboard",
    },
    {
        label: "Booking Imports",
        path: "/finance/booking-imports",
    },
    {
        label: "Booking View",
        path: "/viewbookings_finace",
    },
    {
        label: "Commission Rules",
        path: "/finance/commission-rules",
    },
    {
        label: "Payout Runs",
        path: "/finance/payout-runs",
    },
    {
        label: "Refunds",
        path: "/finance/refunds",
    },
    {
        label: "Financial Reports",
        path: "/finance/reports",
    },
];

const SidebarFinance: React.FC<SidebarFinanceProps> = ({
    activeItem = "Dashboard",
}) => {
    const navigate = useNavigate();

    return (
        <aside className="flex h-screen w-64 flex-col border-r border-gray-200 bg-white">

            {/* Header */}
            <div className="border-b border-gray-200 px-6 py-6">
                <h1 className="text-xl font-bold tracking-tight text-gray-900">
                    Cadence
                </h1>

                <p className="mt-1 text-sm text-gray-500">
                    Finance Portal
                </p>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-3 py-6">

                <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
                    Finance
                </p>

                <div className="space-y-1">

                    {menuItems.map((item) => {
                        const isActive =
                            activeItem === item.label;

                        return (
                            <button
                                key={item.label}
                                type="button"
                                onClick={() =>
                                    navigate(item.path)
                                }
                                className={`w-full rounded-lg px-3 py-2.5 text-left text-sm font-medium transition ${isActive
                                        ? "bg-gray-900 text-white"
                                        : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                                    }`}
                            >
                                {item.label}
                            </button>
                        );
                    })}

                </div>
            </nav>

            {/* Bottom */}
            <div className="border-t border-gray-200 p-3">

                <button
                    type="button"
                    onClick={() => navigate("/")}
                    className="w-full rounded-lg px-3 py-2.5 text-left text-sm font-medium text-gray-600 transition hover:bg-red-50 hover:text-red-600"
                >
                    Logout
                </button>

            </div>
        </aside>
    );
};

export default SidebarFinance;