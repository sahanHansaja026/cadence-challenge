import { randomUUID } from "crypto";

import { query } from "../db/client";

import type {
    CreateAgentProfileInput,
    UpdateAgentProfileInput,
} from "../schemas/agent.schema";

export interface AgentProfile {
    id: string;
    user_id: string;
    company_id: string;
    agent_code: string;
    full_name: string;
    status: string;
    ended_at: string | null;
    created_at: string;
}


/*
 * Get the logged-in agent's profile
 */
export async function getMyAgentProfile(
    userId: string,
    companyId: string,
): Promise<AgentProfile | null> {

    const rows =
        await query<AgentProfile>(
            `
            SELECT
                id,
                user_id,
                company_id,
                agent_code,
                full_name,
                status,
                ended_at,
                created_at
            FROM agents
            WHERE user_id = $1
              AND company_id = $2
            LIMIT 1
            `,
            [
                userId,
                companyId,
            ],
        );

    return rows[0] ?? null;
}


/*
 * Create agent profile
 */
export async function createMyAgentProfile(
    userId: string,
    companyId: string,
    input: CreateAgentProfileInput,
): Promise<AgentProfile> {

    /*
     * Check whether profile already exists
     */
    const existing =
        await query<{
            id: string;
        }>(
            `
            SELECT id
            FROM agents
            WHERE user_id = $1
            LIMIT 1
            `,
            [userId],
        );

    if (existing.length > 0) {
        throw new Error(
            "AGENT_PROFILE_ALREADY_EXISTS",
        );
    }


    /*
     * Check agent code inside this company
     */
    const existingCode =
        await query<{
            id: string;
        }>(
            `
            SELECT id
            FROM agents
            WHERE company_id = $1
              AND agent_code = $2
            LIMIT 1
            `,
            [
                companyId,
                input.agent_code,
            ],
        );

    if (existingCode.length > 0) {
        throw new Error(
            "AGENT_CODE_ALREADY_EXISTS",
        );
    }


    /*
     * Generate a separate agent ID.
     *
     * This is NOT users.id.
     */
    const agentId =
        `agent_${randomUUID()}`;


    const rows =
        await query<AgentProfile>(
            `
            INSERT INTO agents (
                id,
                user_id,
                company_id,
                agent_code,
                full_name,
                status
            )
            VALUES (
                $1,
                $2,
                $3,
                $4,
                $5,
                'ACTIVE'
            )
            RETURNING
                id,
                user_id,
                company_id,
                agent_code,
                full_name,
                status,
                ended_at,
                created_at
            `,
            [
                agentId,
                userId,
                companyId,
                input.agent_code,
                input.full_name,
            ],
        );

    const agent =
        rows[0];

    if (!agent) {
        throw new Error(
            "AGENT_PROFILE_CREATE_FAILED",
        );
    }

    return agent;
}


/*
 * Update logged-in agent profile
 */
export async function updateMyAgentProfile(
    userId: string,
    companyId: string,
    input: UpdateAgentProfileInput,
): Promise<AgentProfile> {

    const rows =
        await query<AgentProfile>(
            `
            UPDATE agents
            SET full_name = $1
            WHERE user_id = $2
              AND company_id = $3
            RETURNING
                id,
                user_id,
                company_id,
                agent_code,
                full_name,
                status,
                ended_at,
                created_at
            `,
            [
                input.full_name,
                userId,
                companyId,
            ],
        );

    const agent =
        rows[0];

    if (!agent) {
        throw new Error(
            "AGENT_PROFILE_NOT_FOUND",
        );
    }

    return agent;
}