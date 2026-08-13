import { useEffect } from "react";

import { useAuth } from "../../context/AuthContext";

import {
  useAuthorizationCheck,
} from "../../authorization/AuthorizationCheck";

import SidebarAgent from "../../component/layout/sidebar-agent";

function Agent_Dashboard() {
  const { user, isLoading } = useAuth();

  const {
    agentAuthorization,
  } = useAuthorizationCheck();

  useEffect(() => {
    if (!isLoading) {
      agentAuthorization();
    }
  }, [isLoading]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="flex min-h-screen bg-gray-50">

      {/* Agent Sidebar */}
      <SidebarAgent
        activeItem="Dashboard"
      />

      {/* Main Content */}
      <main className="flex-1 p-8">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Agent Dashboard
          </h1>

          <p className="mt-2 text-gray-500">
            Welcome back, {user?.email}
          </p>
        </div>

        {/* Agent Information */}
        <div className="mb-8 rounded-xl border border-gray-200 bg-white p-6">

          <h2 className="mb-5 text-lg font-semibold text-gray-900">
            My Account
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

        {/* Summary */}
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">

          {/* Bookings */}
          <div className="rounded-xl border border-gray-200 bg-white p-6">

            <p className="text-sm text-gray-500">
              My Bookings
            </p>

            <p className="mt-2 text-3xl font-bold text-gray-900">
              0
            </p>

            <p className="mt-2 text-sm text-gray-500">
              Total bookings assigned to you
            </p>

          </div>

          {/* Payout */}
          <div className="rounded-xl border border-gray-200 bg-white p-6">

            <p className="text-sm text-gray-500">
              My Payout
            </p>

            <p className="mt-2 text-3xl font-bold text-gray-900">
              0.00
            </p>

            <p className="mt-2 text-sm text-gray-500">
              Current payout amount
            </p>

          </div>

        </div>

      </main>
    </div>
  );
}

export default Agent_Dashboard;