import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useAuthorizationCheck } from "../../authorization/AuthorizationCheck";
import SidebarAdmin from "../../component/layout/sidebar-admin";
import api from "../../services/api";

interface Agent {
    id: string;
    agent_code: string;
    full_name: string;
    status: string;
}

interface Team {
    id: string;
    company_id: string;
    name: string;
    leadAgent: {
        id: string;
        agentCode: string;
        fullName: string;
    };
    members: Agent[];
}

function TeamManagement() {
    const { isLoading } = useAuth();

    const { adminAuthorization } =
        useAuthorizationCheck();

    const [teams, setTeams] =
        useState<Team[]>([]);

    const [agents, setAgents] =
        useState<Agent[]>([]);

    const [teamName, setTeamName] =
        useState("");

    const [leadAgentId, setLeadAgentId] =
        useState("");

    const [selectedMembers, setSelectedMembers] =
        useState<string[]>([]);

    const [loadingTeams, setLoadingTeams] =
        useState(false);

    const [loadingAgents, setLoadingAgents] =
        useState(false);

    const [creating, setCreating] =
        useState(false);

    const [error, setError] =
        useState("");

    const [success, setSuccess] =
        useState("");


    /*
     * ==========================================
     * ADMIN AUTHORIZATION
     * ==========================================
     */

    useEffect(() => {
        if (!isLoading) {
            adminAuthorization();
        }
    }, [isLoading]);


    /*
     * ==========================================
     * INITIAL DATA
     * ==========================================
     */

    useEffect(() => {
        if (!isLoading) {
            loadTeams();
            loadAgents();
        }
    }, [isLoading]);


    /*
     * ==========================================
     * LOAD TEAMS
     * ==========================================
     */

    const loadTeams = async () => {
        try {
            setLoadingTeams(true);
            setError("");

            const response =
                await api.get("/teams");

            console.log(
                "Teams API response:",
                response.data,
            );

            /*
             * Expected backend response:
             *
             * {
             *   data: {
             *      teams: [...]
             *   }
             * }
             */

            const teamList =
                response.data?.data?.teams ??
                response.data?.teams ??
                [];

            setTeams(teamList);

        } catch (error: any) {

            console.error(
                "Load teams error:",
                error,
            );

            setError(
                error?.response?.data?.error?.message ??
                error?.response?.data?.message ??
                "Failed to load teams",
            );

        } finally {
            setLoadingTeams(false);
        }
    };


    /*
     * ==========================================
     * LOAD AGENTS
     * ==========================================
     */

    const loadAgents = async () => {
        try {
            setLoadingAgents(true);
            setError("");

            const response =
                await api.get("/agents");

            console.log(
                "Agents API response:",
                response.data,
            );

            /*
             * Your actual API response:
             *
             * {
             *   data: {
             *      agents: [...]
             *   }
             * }
             */

            const agentList =
                response.data?.data?.agents ??
                [];

            console.log(
                "Agents loaded:",
                agentList,
            );

            setAgents(agentList);

        } catch (error: any) {

            console.error(
                "Load agents error:",
                error,
            );

            setError(
                error?.response?.data?.error?.message ??
                error?.response?.data?.message ??
                "Failed to load agents",
            );

        } finally {
            setLoadingAgents(false);
        }
    };


    /*
     * ==========================================
     * MEMBER SELECTION
     * ==========================================
     */

    const handleMemberChange = (
        agentId: string,
    ) => {

        setSelectedMembers((previous) => {

            if (
                previous.includes(agentId)
            ) {
                return previous.filter(
                    (id) =>
                        id !== agentId,
                );
            }

            return [
                ...previous,
                agentId,
            ];
        });
    };


    /*
     * ==========================================
     * TEAM LEAD SELECTION
     * ==========================================
     */

    const handleLeadChange = (
        agentId: string,
    ) => {

        setLeadAgentId(agentId);

        /*
         * Team lead must also be
         * a team member.
         */

        if (
            agentId &&
            !selectedMembers.includes(
                agentId,
            )
        ) {
            setSelectedMembers(
                (previous) => [
                    ...previous,
                    agentId,
                ],
            );
        }
    };


    /*
     * ==========================================
     * CREATE TEAM
     * ==========================================
     */

    const handleCreateTeam = async (
        event: React.FormEvent,
    ) => {

        event.preventDefault();

        setError("");
        setSuccess("");


        /*
         * Validate team name
         */

        if (!teamName.trim()) {
            setError(
                "Team name is required.",
            );

            return;
        }


        /*
         * Validate team lead
         */

        if (!leadAgentId) {
            setError(
                "Please select a team lead.",
            );

            return;
        }


        /*
         * Validate members
         */

        if (
            selectedMembers.length === 0
        ) {
            setError(
                "Please select at least one team member.",
            );

            return;
        }


        /*
         * Make sure lead is a member
         */

        if (
            !selectedMembers.includes(
                leadAgentId,
            )
        ) {
            setError(
                "Team lead must be a team member.",
            );

            return;
        }


        try {

            setCreating(true);


            /*
             * Axios POST
             *
             * POST /api/teams
             */

            const response =
                await api.post(
                    "/teams",
                    {
                        name: teamName.trim(),

                        leadAgentId,

                        memberAgentIds:
                            selectedMembers,
                    },
                );


            console.log(
                "Create team response:",
                response.data,
            );


            /*
             * Success
             */

            setSuccess(
                "Team created successfully.",
            );


            /*
             * Clear form
             */

            setTeamName("");

            setLeadAgentId("");

            setSelectedMembers([]);


            /*
             * Reload teams
             */

            await loadTeams();

        } catch (error: any) {

            console.error(
                "Create team error:",
                error,
            );

            setError(
                error?.response?.data?.error?.message ??
                error?.response?.data?.message ??
                "Failed to create team",
            );

        } finally {

            setCreating(false);

        }
    };


    /*
     * ==========================================
     * LOADING SCREEN
     * ==========================================
     */

    if (isLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                Loading...
            </div>
        );
    }


    /*
     * ==========================================
     * PAGE
     * ==========================================
     */

    return (
        <div className="flex min-h-screen bg-gray-50">

            <SidebarAdmin
                activeItem="Teams"
            />


            <main className="flex-1 p-8">

                {/* ============================
                    HEADER
                ============================= */}

                <div className="mb-8">

                    <h1 className="text-3xl font-bold text-gray-900">
                        Team Management
                    </h1>

                    <p className="mt-2 text-gray-500">
                        Create teams and assign
                        agents to teams.
                    </p>

                </div>


                {/* ============================
                    ERROR
                ============================= */}

                {error && (
                    <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700">
                        {error}
                    </div>
                )}


                {/* ============================
                    SUCCESS
                ============================= */}

                {success && (
                    <div className="mb-6 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-green-700">
                        {success}
                    </div>
                )}


                <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">


                    {/* ============================
                        CREATE TEAM
                    ============================= */}

                    <section className="rounded-xl bg-white p-6 shadow-sm lg:col-span-1">

                        <h2 className="mb-5 text-xl font-semibold text-gray-900">
                            Create Team
                        </h2>


                        <form
                            onSubmit={
                                handleCreateTeam
                            }
                            className="space-y-5"
                        >


                            {/* TEAM NAME */}

                            <div>

                                <label className="mb-2 block text-sm font-medium text-gray-700">
                                    Team Name
                                </label>

                                <input
                                    type="text"
                                    value={teamName}
                                    onChange={(
                                        event,
                                    ) =>
                                        setTeamName(
                                            event.target
                                                .value,
                                        )
                                    }
                                    placeholder="Enter team name"
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                />

                            </div>


                            {/* TEAM LEAD */}

                            <div>

                                <label className="mb-2 block text-sm font-medium text-gray-700">
                                    Team Lead
                                </label>


                                <select
                                    value={
                                        leadAgentId
                                    }
                                    onChange={(
                                        event,
                                    ) =>
                                        handleLeadChange(
                                            event.target
                                                .value,
                                        )
                                    }
                                    disabled={
                                        loadingAgents
                                    }
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-100"
                                >

                                    <option value="">
                                        {loadingAgents
                                            ? "Loading agents..."
                                            : "Select team lead"}
                                    </option>


                                    {agents
                                        .filter(
                                            (
                                                agent,
                                            ) =>
                                                agent.status ===
                                                "ACTIVE",
                                        )
                                        .map(
                                            (
                                                agent,
                                            ) => (

                                                <option
                                                    key={
                                                        agent.id
                                                    }
                                                    value={
                                                        agent.id
                                                    }
                                                >
                                                    {
                                                        agent.full_name
                                                    }{" "}
                                                    (
                                                    {
                                                        agent.agent_code
                                                    }
                                                    )
                                                </option>

                                            ),
                                        )}

                                </select>

                            </div>


                            {/* TEAM MEMBERS */}

                            <div>

                                <label className="mb-2 block text-sm font-medium text-gray-700">
                                    Team Members
                                </label>


                                <div className="max-h-60 overflow-y-auto rounded-lg border border-gray-300">


                                    {loadingAgents ? (

                                        <p className="p-4 text-sm text-gray-500">
                                            Loading agents...
                                        </p>

                                    ) : agents.length ===
                                        0 ? (

                                        <p className="p-4 text-sm text-gray-500">
                                            No agents available.
                                        </p>

                                    ) : (

                                        agents
                                            .filter(
                                                (
                                                    agent,
                                                ) =>
                                                    agent.status ===
                                                    "ACTIVE",
                                            )
                                            .map(
                                                (
                                                    agent,
                                                ) => (

                                                    <label
                                                        key={
                                                            agent.id
                                                        }
                                                        className="flex cursor-pointer items-center gap-3 border-b border-gray-100 px-4 py-3 last:border-b-0 hover:bg-gray-50"
                                                    >

                                                        <input
                                                            type="checkbox"
                                                            checked={selectedMembers.includes(
                                                                agent.id,
                                                            )}
                                                            onChange={() =>
                                                                handleMemberChange(
                                                                    agent.id,
                                                                )
                                                            }
                                                            className="h-4 w-4"
                                                        />


                                                        <div>

                                                            <p className="text-sm font-medium text-gray-900">
                                                                {
                                                                    agent.full_name
                                                                }
                                                            </p>

                                                            <p className="text-xs text-gray-500">
                                                                {
                                                                    agent.agent_code
                                                                }
                                                            </p>

                                                        </div>

                                                    </label>

                                                ),
                                            )

                                    )}

                                </div>

                            </div>


                            {/* CREATE BUTTON */}

                            <button
                                type="submit"
                                disabled={
                                    creating ||
                                    loadingAgents
                                }
                                className="w-full rounded-lg bg-blue-600 px-4 py-2.5 font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                            >

                                {creating
                                    ? "Creating..."
                                    : "Create Team"}

                            </button>

                        </form>

                    </section>


                    {/* ============================
                        TEAM LIST
                    ============================= */}

                    <section className="rounded-xl bg-white p-6 shadow-sm lg:col-span-2">


                        <div className="mb-5 flex items-center justify-between">

                            <div>

                                <h2 className="text-xl font-semibold text-gray-900">
                                    Teams
                                </h2>

                                <p className="mt-1 text-sm text-gray-500">
                                    Existing teams and
                                    their members.
                                </p>

                            </div>


                            <button
                                type="button"
                                onClick={
                                    loadTeams
                                }
                                disabled={
                                    loadingTeams
                                }
                                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                            >
                                {loadingTeams
                                    ? "Loading..."
                                    : "Refresh"}
                            </button>

                        </div>


                        {/* LOADING */}

                        {loadingTeams && (

                            <div className="py-10 text-center text-gray-500">
                                Loading teams...
                            </div>

                        )}


                        {/* EMPTY */}

                        {!loadingTeams &&
                            teams.length === 0 && (

                                <div className="rounded-lg border border-dashed border-gray-300 py-10 text-center">

                                    <p className="font-medium text-gray-700">
                                        No teams found
                                    </p>

                                    <p className="mt-1 text-sm text-gray-500">
                                        Create your first
                                        team using the form.
                                    </p>

                                </div>

                            )}


                        {/* TEAM LIST */}

                        {!loadingTeams &&
                            teams.length > 0 && (

                                <div className="space-y-4">

                                    {teams.map(
                                        (
                                            team,
                                        ) => (

                                            <div
                                                key={
                                                    team.id
                                                }
                                                className="rounded-lg border border-gray-200 p-5"
                                            >


                                                {/* TEAM HEADER */}

                                                <div className="mb-4 flex items-start justify-between">

                                                    <div>

                                                        <h3 className="text-lg font-semibold text-gray-900">
                                                            {
                                                                team.name
                                                            }
                                                        </h3>


                                                        <p className="mt-1 text-sm text-gray-500">

                                                            Team Lead:{" "}

                                                            <span className="font-medium text-gray-700">

                                                                {
                                                                    team
                                                                        .leadAgent
                                                                        ?.fullName
                                                                }

                                                            </span>

                                                        </p>

                                                    </div>


                                                    <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">

                                                        {
                                                            team.members
                                                                ?.length ??
                                                            0
                                                        }{" "}
                                                        members

                                                    </span>

                                                </div>


                                                {/* MEMBERS */}

                                                <div>

                                                    <p className="mb-2 text-sm font-medium text-gray-700">
                                                        Members
                                                    </p>


                                                    <div className="flex flex-wrap gap-2">

                                                        {team.members
                                                            ?.length ? (

                                                            team.members.map(
                                                                (
                                                                    member,
                                                                ) => (

                                                                    <span
                                                                        key={
                                                                            member.id
                                                                        }
                                                                        className="rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-700"
                                                                    >

                                                                        {
                                                                            member.full_name
                                                                        }

                                                                        {" "}

                                                                        <span className="text-xs text-gray-400">

                                                                            (
                                                                            {
                                                                                member.agent_code
                                                                            }
                                                                            )

                                                                        </span>

                                                                    </span>

                                                                ),
                                                            )

                                                        ) : (

                                                            <span className="text-sm text-gray-400">
                                                                No members
                                                            </span>

                                                        )}

                                                    </div>

                                                </div>

                                            </div>

                                        ),
                                    )}

                                </div>

                            )}

                    </section>

                </div>

            </main>

        </div>
    );
}

export default TeamManagement;