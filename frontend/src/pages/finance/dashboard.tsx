import { useEffect } from "react";

import { useAuth } from "../../context/AuthContext";

import {
  useAuthorizationCheck,
} from "../../authorization/AuthorizationCheck";
import SidebarFinance from "../../component/layout/sidebar-finace";



function Finace_Dashboard() {
  const { user, isLoading } = useAuth();

  const {
    financeAuthorization,
  } = useAuthorizationCheck();

  useEffect(() => {
    if (!isLoading) {
      financeAuthorization();
    }
  }, [isLoading]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="flex min-h-screen bg-gray-50">

      {/* Finance Sidebar */}
      <SidebarFinance
        activeItem="Dashboard"
      />

      {/* Main Content */}
      <main className="flex-1 p-8">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Finance Dashboard
          </h1>

          <p className="mt-2 text-gray-500">
            Welcome back, {user?.email}
          </p>
        </div>

        {/* Finance Information */}
        <div className="mb-8 rounded-xl border border-gray-200 bg-white p-6">

          <h2 className="mb-5 text-lg font-semibold text-gray-900">
            Account Information
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

        {/* Finance Summary */}
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">

          {/* Booking Imports */}
          <div className="rounded-xl border border-gray-200 bg-white p-6">
            <p className="text-sm text-gray-500">
              Booking Imports
            </p>

            <p className="mt-2 text-3xl font-bold text-gray-900">
              0
            </p>

            <p className="mt-2 text-sm text-gray-500">
              Recent imports
            </p>
          </div>

          {/* Commission Rules */}
          <div className="rounded-xl border border-gray-200 bg-white p-6">
            <p className="text-sm text-gray-500">
              Commission Rules
            </p>

            <p className="mt-2 text-3xl font-bold text-gray-900">
              0
            </p>

            <p className="mt-2 text-sm text-gray-500">
              Active rule sets
            </p>
          </div>

          {/* Payout Runs */}
          <div className="rounded-xl border border-gray-200 bg-white p-6">
            <p className="text-sm text-gray-500">
              Payout Runs
            </p>

            <p className="mt-2 text-3xl font-bold text-gray-900">
              0
            </p>

            <p className="mt-2 text-sm text-gray-500">
              Current payout runs
            </p>
          </div>

          {/* Refunds */}
          <div className="rounded-xl border border-gray-200 bg-white p-6">
            <p className="text-sm text-gray-500">
              Refunds
            </p>

            <p className="mt-2 text-3xl font-bold text-gray-900">
              0
            </p>

            <p className="mt-2 text-sm text-gray-500">
              Refunds to reconcile
            </p>
          </div>

        </div>

      </main>
    </div>
  );
}

export default Finace_Dashboard;