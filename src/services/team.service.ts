import { randomUUID } from "crypto";
import { query } from "../db/client";

interface CreateTeamData {
    companyId: string;
    name: string;
    leadAgentId: string;
    memberAgentIds: string[];
}

interface UpdateTeamData {
    companyId: string;
    teamId: string;
    name?: string;
    leadAgentId?: string;
    memberAgentIds?: string[];
}

interface TeamRow {
    id: string;
    company_id: string;
    name: string;
    lead_agent_id: string;
}

interface AgentRow {
    id: string;
    agent_code: string;
    full_name: string;
    status: string;
}

/**
 * Check that all selected agents belong to the company.
 */
async function validateAgents(
    companyId: string,
    agentIds: string[],
): Promise<AgentRow[]> {
    const uniqueAgentIds = [...new Set(agentIds)];

    if (uniqueAgentIds.length === 0) {
        throw new Error("At least one team member is required");
    }

    const agents = await query<AgentRow>(
        `
        SELECT
            id,
            agent_code,
            full_name,
            status
        FROM agents
        WHERE company_id = $1
          AND id = ANY($2::text[])
        `,
        [companyId, uniqueAgentIds],
    );

    if (agents.length !== uniqueAgentIds.length) {
        throw new Error(
            "One or more selected agents do not belong to this company",
        );
    }

    return agents;
}

/**
 * Check that the team lead exists, belongs to the company,
 * and is active.
 */
async function validateLead(
    companyId: string,
    leadAgentId: string,
): Promise<AgentRow> {
    const leadAgents = await query<AgentRow>(
        `
        SELECT
            id,
            agent_code,
            full_name,
            status
        FROM agents
        WHERE id = $1
          AND company_id = $2
        `,
        [leadAgentId, companyId],
    );

    const lead = leadAgents[0];

    if (!lead) {
        throw new Error("Team lead not found");
    }

    if (lead.status !== "ACTIVE") {
        throw new Error("Team lead must be an active agent");
    }

    return lead;
}

/**
 * CREATE TEAM
 *
 * Creates a team and assigns its members.
 *
 * The team lead is automatically added as a member
 * if they were not included in memberAgentIds.
 */
export async function createTeam(
    data: CreateTeamData,
) {
    const {
        companyId,
        name,
        leadAgentId,
        memberAgentIds,
    } = data;

    // Remove duplicate members
    const uniqueMemberIds = [
        ...new Set(memberAgentIds),
    ];

    // Team lead must also be a team member
    if (!uniqueMemberIds.includes(leadAgentId)) {
        uniqueMemberIds.push(leadAgentId);
    }

    // Validate members
    await validateAgents(
        companyId,
        uniqueMemberIds,
    );

    // Validate lead
    await validateLead(
        companyId,
        leadAgentId,
    );

    // Create team ID
    const teamId = randomUUID();

    const teams = await query<TeamRow>(
        `
        INSERT INTO teams (
            id,
            company_id,
            name,
            lead_agent_id
        )
        VALUES ($1, $2, $3, $4)
        RETURNING
            id,
            company_id,
            name,
            lead_agent_id
        `,
        [
            teamId,
            companyId,
            name,
            leadAgentId,
        ],
    );

    const team = teams[0];

    if (!team) {
        throw new Error("Failed to create team");
    }

    // Add team members
    for (const agentId of uniqueMemberIds) {
        await query(
            `
            INSERT INTO team_members (
                team_id,
                agent_id
            )
            VALUES ($1, $2)
            `,
            [teamId, agentId],
        );
    }

    // Return complete team
    return getTeamById(
        companyId,
        teamId,
    );
}

/**
 * GET ALL TEAMS
 *
 * Returns all teams belonging to the authenticated
 * user's company.
 */
export async function getTeams(
    companyId: string,
) {
    const teams = await query<TeamRow & {
        lead_agent_code: string;
        lead_agent_name: string;
    }>(
        `
        SELECT
            t.id,
            t.company_id,
            t.name,
            t.lead_agent_id,
            a.agent_code AS lead_agent_code,
            a.full_name AS lead_agent_name
        FROM teams t
        INNER JOIN agents a
            ON a.id = t.lead_agent_id
        WHERE t.company_id = $1
        ORDER BY t.name ASC
        `,
        [companyId],
    );

    const result = [];

    for (const team of teams) {
        const members = await query<AgentRow>(
            `
            SELECT
                a.id,
                a.agent_code,
                a.full_name,
                a.status
            FROM team_members tm
            INNER JOIN agents a
                ON a.id = tm.agent_id
            WHERE tm.team_id = $1
            ORDER BY a.full_name ASC
            `,
            [team.id],
        );

        result.push({
            id: team.id,
            companyId: team.company_id,
            name: team.name,

            leadAgent: {
                id: team.lead_agent_id,
                agentCode: team.lead_agent_code,
                fullName: team.lead_agent_name,
            },

            members,
        });
    }

    return result;
}

/**
 * GET ONE TEAM
 *
 * Returns one team and all its members.
 */
export async function getTeamById(
    companyId: string,
    teamId: string,
) {
    const teams = await query<TeamRow & {
        lead_agent_code: string;
        lead_agent_name: string;
    }>(
        `
        SELECT
            t.id,
            t.company_id,
            t.name,
            t.lead_agent_id,
            a.agent_code AS lead_agent_code,
            a.full_name AS lead_agent_name
        FROM teams t
        INNER JOIN agents a
            ON a.id = t.lead_agent_id
        WHERE t.id = $1
          AND t.company_id = $2
        `,
        [
            teamId,
            companyId,
        ],
    );

    const team = teams[0];

    if (!team) {
        throw new Error("Team not found");
    }

    const members = await query<AgentRow>(
        `
        SELECT
            a.id,
            a.agent_code,
            a.full_name,
            a.status
        FROM team_members tm
        INNER JOIN agents a
            ON a.id = tm.agent_id
        WHERE tm.team_id = $1
        ORDER BY a.full_name ASC
        `,
        [teamId],
    );

    return {
        id: team.id,
        companyId: team.company_id,
        name: team.name,

        leadAgent: {
            id: team.lead_agent_id,
            agentCode: team.lead_agent_code,
            fullName: team.lead_agent_name,
        },

        members,
    };
}

/**
 * UPDATE TEAM
 *
 * Can update:
 * - team name
 * - team lead
 * - team members
 *
 * If memberAgentIds is supplied, the existing membership
 * is replaced with the supplied list.
 */
export async function updateTeam(
    data: UpdateTeamData,
) {
    const {
        companyId,
        teamId,
        name,
        leadAgentId,
        memberAgentIds,
    } = data;

    // Check existing team
    const existingTeams = await query<TeamRow>(
        `
        SELECT
            id,
            company_id,
            name,
            lead_agent_id
        FROM teams
        WHERE id = $1
          AND company_id = $2
        `,
        [
            teamId,
            companyId,
        ],
    );

    const existingTeam = existingTeams[0];

    if (!existingTeam) {
        throw new Error("Team not found");
    }

    // Use old lead if no new lead was provided
    const newLeadAgentId =
        leadAgentId ?? existingTeam.lead_agent_id;

    /*
     * If members are being updated,
     * replace the entire member list.
     */
    if (memberAgentIds !== undefined) {
        const uniqueMemberIds = [
            ...new Set(memberAgentIds),
        ];

        // Make sure lead is also a member
        if (!uniqueMemberIds.includes(newLeadAgentId)) {
            uniqueMemberIds.push(newLeadAgentId);
        }

        // Validate members
        await validateAgents(
            companyId,
            uniqueMemberIds,
        );

        // Validate lead
        await validateLead(
            companyId,
            newLeadAgentId,
        );

        // Update team information
        await query(
            `
            UPDATE teams
            SET
                name = COALESCE($1, name),
                lead_agent_id = $2
            WHERE id = $3
              AND company_id = $4
            `,
            [
                name ?? null,
                newLeadAgentId,
                teamId,
                companyId,
            ],
        );

        // Remove old members
        await query(
            `
            DELETE FROM team_members
            WHERE team_id = $1
            `,
            [teamId],
        );

        // Add new members
        for (const agentId of uniqueMemberIds) {
            await query(
                `
                INSERT INTO team_members (
                    team_id,
                    agent_id
                )
                VALUES ($1, $2)
                `,
                [
                    teamId,
                    agentId,
                ],
            );
        }
    } else {
        /*
         * Only name or lead is being changed.
         */

        if (leadAgentId !== undefined) {
            await validateLead(
                companyId,
                leadAgentId,
            );
        }

        if (
            name !== undefined ||
            leadAgentId !== undefined
        ) {
            await query(
                `
                UPDATE teams
                SET
                    name = COALESCE($1, name),
                    lead_agent_id = COALESCE($2, lead_agent_id)
                WHERE id = $3
                  AND company_id = $4
                `,
                [
                    name ?? null,
                    leadAgentId ?? null,
                    teamId,
                    companyId,
                ],
            );
        }
    }

    return getTeamById(
        companyId,
        teamId,
    );
}

/**
 * DELETE TEAM
 *
 * team_members records are automatically deleted
 * because your database has:
 *
 * ON DELETE CASCADE
 */
export async function deleteTeam(
    companyId: string,
    teamId: string,
) {
    // Check team exists
    const teams = await query<TeamRow>(
        `
        SELECT
            id,
            company_id,
            name,
            lead_agent_id
        FROM teams
        WHERE id = $1
          AND company_id = $2
        `,
        [
            teamId,
            companyId,
        ],
    );

    const team = teams[0];

    if (!team) {
        throw new Error("Team not found");
    }

    // Delete team
    await query(
        `
        DELETE FROM teams
        WHERE id = $1
          AND company_id = $2
        `,
        [
            teamId,
            companyId,
        ],
    );

    return {
        id: teamId,
    };
}