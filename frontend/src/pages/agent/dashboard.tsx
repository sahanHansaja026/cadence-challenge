import { useEffect, useState } from "react";

import { useAuth } from "../../context/AuthContext";
import {
  useAuthorizationCheck,
} from "../../authorization/AuthorizationCheck";

import SidebarAgent from "../../component/layout/sidebar-agent";
import Button from "../../component/ui/Button";
import api from "../../services/api";

interface AgentProfile {
  id: string;
  user_id: string;
  company_id: string;
  agent_code: string;
  full_name: string;
  status: string;
  ended_at: string | null;
  created_at: string;
}

function Agent_Dashboard() {

  const {
    user,
    isLoading,
  } = useAuth();

  const {
    agentAuthorization,
  } = useAuthorizationCheck();

  const [agent, setAgent] =
    useState<AgentProfile | null>(null);

  const [loadingProfile, setLoadingProfile] =
    useState(true);

  const [creating, setCreating] =
    useState(false);

  const [error, setError] =
    useState("");

  const [showCreateForm, setShowCreateForm] =
    useState(false);

  const [agentCode, setAgentCode] =
    useState("");

  const [fullName, setFullName] =
    useState("");


  useEffect(() => {

    if (!isLoading) {
      agentAuthorization();
      loadAgentProfile();
    }

  }, [isLoading]);


  const loadAgentProfile = async () => {

    try {

      setLoadingProfile(true);
      setError("");

      const token =
        localStorage.getItem("token");

      const response =
        await api.get(
          "/agents/me",
          {
            headers: {
              Authorization:
                `Bearer ${token}`,
            },
          },
        );

      setAgent(
        response.data.data.agent,
      );

    } catch (error: any) {

      if (
        error?.response?.status === 404
      ) {
        /*
         * Agent has logged in,
         * but has not created
         * their profile yet.
         */

        setAgent(null);
        setShowCreateForm(true);

      } else {

        console.error(
          "Failed to load agent profile:",
          error,
        );

        setError(
          error?.response?.data?.error?.message ||
          "Failed to load agent profile.",
        );
      }

    } finally {

      setLoadingProfile(false);

    }
  };


  const handleCreateProfile =
    async () => {

      if (!agentCode.trim()) {
        setError(
          "Agent code is required.",
        );
        return;
      }

      if (!fullName.trim()) {
        setError(
          "Full name is required.",
        );
        return;
      }

      try {

        setCreating(true);
        setError("");

        const token =
          localStorage.getItem("token");

        const response =
          await api.post(
            "/agents/me",
            {
              agent_code:
                agentCode.trim(),

              full_name:
                fullName.trim(),
            },
            {
              headers: {
                Authorization:
                  `Bearer ${token}`,
              },
            },
          );

        setAgent(
          response.data.data.agent,
        );

        setShowCreateForm(false);

      } catch (error: any) {

        console.error(
          "Create agent profile error:",
          error,
        );

        setError(
          error?.response?.data?.error?.message ||
          "Failed to create agent profile.",
        );

      } finally {

        setCreating(false);

      }
    };


  if (isLoading || loadingProfile) {

    return (
      <div className="flex min-h-screen items-center justify-center">
        Loading...
      </div>
    );

  }


  return (
    <div className="flex min-h-screen bg-gray-50">

      <SidebarAgent
        activeItem="Dashboard"
      />

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


        {/* Error */}

        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}


        {/* CREATE PROFILE */}

        {showCreateForm && !agent && (

          <div className="mb-8 max-w-2xl rounded-xl border border-gray-200 bg-white p-6">

            <h2 className="text-xl font-semibold text-gray-900">
              Create Agent Profile
            </h2>

            <p className="mt-2 text-sm text-gray-500">
              Your login account exists, but your
              agent profile has not been created yet.
            </p>


            {/* Email */}

            <div className="mt-6">

              <label className="text-sm font-medium text-gray-700">
                Email
              </label>

              <input
                type="text"
                value={user?.email ?? ""}
                disabled
                className="mt-1 w-full rounded-lg border border-gray-300 bg-gray-100 px-4 py-2"
              />

            </div>


            {/* Company */}

            <div className="mt-4">

              <label className="text-sm font-medium text-gray-700">
                Company
              </label>

              <input
                type="text"
                value={user?.companyId ?? ""}
                disabled
                className="mt-1 w-full rounded-lg border border-gray-300 bg-gray-100 px-4 py-2"
              />

            </div>


            {/* Full name */}

            <div className="mt-4">

              <label className="text-sm font-medium text-gray-700">
                Full Name
              </label>

              <input
                type="text"
                value={fullName}
                onChange={(event) =>
                  setFullName(
                    event.target.value,
                  )
                }
                placeholder="Enter your full name"
                className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2"
              />

            </div>


            {/* Agent code */}

            <div className="mt-4">

              <label className="text-sm font-medium text-gray-700">
                Agent Code
              </label>

              <input
                type="text"
                value={agentCode}
                onChange={(event) =>
                  setAgentCode(
                    event.target.value,
                  )
                }
                placeholder="e.g. AG-001"
                className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2"
              />

            </div>


            <div className="mt-6">

              <Button
                type="button"
                variant="primary"
                onClick={
                  handleCreateProfile
                }
                disabled={creating}
              >
                {creating
                  ? "Creating..."
                  : "Create Profile"}
              </Button>

            </div>

          </div>

        )}


        {/* PROFILE */}

        {agent && (

          <div className="mb-8 rounded-xl border border-gray-200 bg-white p-6">

            <h2 className="mb-6 text-xl font-semibold text-gray-900">
              My Agent Profile
            </h2>


            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">

              <div>

                <p className="text-sm text-gray-500">
                  Full Name
                </p>

                <p className="mt-1 font-medium text-gray-900">
                  {agent.full_name}
                </p>

              </div>


              <div>

                <p className="text-sm text-gray-500">
                  Agent Code
                </p>

                <p className="mt-1 font-medium text-gray-900">
                  {agent.agent_code}
                </p>

              </div>


              <div>

                <p className="text-sm text-gray-500">
                  Status
                </p>

                <p className="mt-1 font-medium text-green-600">
                  {agent.status}
                </p>

              </div>


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
                  {agent.company_id}
                </p>

              </div>


              <div>

                <p className="text-sm text-gray-500">
                  Agent ID
                </p>

                <p className="mt-1 break-all font-medium text-gray-900">
                  {agent.id}
                </p>

              </div>

            </div>

          </div>

        )}


        {/* Dashboard statistics */}

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">

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