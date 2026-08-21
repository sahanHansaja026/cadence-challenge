import type {
    Request,
    Response,
} from "express";

import {
    createAgentProfileSchema,
    updateAgentProfileSchema,
} from "../schemas/agent.schema";

import {
    getMyAgentProfile,
    createMyAgentProfile,
    updateMyAgentProfile,
    getAllAgents,
} from "../services/agent.service";


/*
 * GET /api/agents/me
 */
export async function getMyAgentController(
    req: Request,
    res: Response,
): Promise<void> {

    if (!req.user) {
        res.status(401).json({
            error: {
                code: "UNAUTHORIZED",
                message:
                    "Authentication required.",
            },
        });

        return;
    }

    try {

        const agent =
            await getMyAgentProfile(
                req.user.userId,
                req.user.companyId,
            );

        /*
         * Profile doesn't exist yet.
         */
        if (!agent) {
            res.status(404).json({
                error: {
                    code:
                        "AGENT_PROFILE_NOT_FOUND",
                    message:
                        "Agent profile has not been created yet.",
                },
            });

            return;
        }

        res.status(200).json({
            data: {
                agent,
            },
        });

    } catch (error: unknown) {

        console.error(
            "Get agent profile error:",
            error,
        );

        res.status(500).json({
            error: {
                code:
                    "AGENT_PROFILE_FETCH_FAILED",
                message:
                    "Failed to load agent profile.",
            },
        });
    }
}


/*
 * POST /api/agents/me
 */
export async function createMyAgentController(
    req: Request,
    res: Response,
): Promise<void> {

    if (!req.user) {
        res.status(401).json({
            error: {
                code: "UNAUTHORIZED",
                message:
                    "Authentication required.",
            },
        });

        return;
    }

    try {

        const parsed =
            createAgentProfileSchema.safeParse(
                req.body,
            );

        if (!parsed.success) {
            res.status(400).json({
                error: {
                    code:
                        "VALIDATION_ERROR",
                    message:
                        "Invalid agent profile data.",
                    details:
                        parsed.error.flatten(),
                },
            });

            return;
        }


        const agent =
            await createMyAgentProfile(
                req.user.userId,
                req.user.companyId,
                parsed.data,
            );

        res.status(201).json({
            data: {
                agent,
            },
        });

    } catch (error: unknown) {

        if (
            error instanceof Error &&
            error.message ===
            "AGENT_PROFILE_ALREADY_EXISTS"
        ) {
            res.status(409).json({
                error: {
                    code:
                        "AGENT_PROFILE_ALREADY_EXISTS",
                    message:
                        "Agent profile already exists.",
                },
            });

            return;
        }


        if (
            error instanceof Error &&
            error.message ===
            "AGENT_CODE_ALREADY_EXISTS"
        ) {
            res.status(409).json({
                error: {
                    code:
                        "AGENT_CODE_ALREADY_EXISTS",
                    message:
                        "Agent code already exists in this company.",
                },
            });

            return;
        }


        console.error(
            "Create agent profile error:",
            error,
        );

        res.status(500).json({
            error: {
                code:
                    "AGENT_PROFILE_CREATE_FAILED",
                message:
                    "Failed to create agent profile.",
            },
        });
    }
}


/*
 * PATCH /api/agents/me
 */
export async function updateMyAgentController(
    req: Request,
    res: Response,
): Promise<void> {

    if (!req.user) {
        res.status(401).json({
            error: {
                code: "UNAUTHORIZED",
                message:
                    "Authentication required.",
            },
        });

        return;
    }

    try {

        const parsed =
            updateAgentProfileSchema.safeParse(
                req.body,
            );

        if (!parsed.success) {
            res.status(400).json({
                error: {
                    code:
                        "VALIDATION_ERROR",
                    message:
                        "Invalid agent profile data.",
                    details:
                        parsed.error.flatten(),
                },
            });

            return;
        }


        const agent =
            await updateMyAgentProfile(
                req.user.userId,
                req.user.companyId,
                parsed.data,
            );

        res.status(200).json({
            data: {
                agent,
            },
        });

    } catch (error: unknown) {

        if (
            error instanceof Error &&
            error.message ===
            "AGENT_PROFILE_NOT_FOUND"
        ) {
            res.status(404).json({
                error: {
                    code:
                        "AGENT_PROFILE_NOT_FOUND",
                    message:
                        "Agent profile has not been created yet.",
                },
            });

            return;
        }

        console.error(
            "Update agent profile error:",
            error,
        );

        res.status(500).json({
            error: {
                code:
                    "AGENT_PROFILE_UPDATE_FAILED",
                message:
                    "Failed to update agent profile.",
            },
        });
    }
}

/*
 * GET /api/agents
 *
 * Admin gets all agents in their company
 */
export async function getAllAgentsController(
    req: Request,
    res: Response,
): Promise<void> {

    if (!req.user) {
        res.status(401).json({
            error: {
                code: "UNAUTHORIZED",
                message: "Authentication required.",
            },
        });

        return;
    }

    try {
        const agents = await getAllAgents(
            req.user.companyId,
        );

        res.status(200).json({
            data: {
                agents,
            },
        });

    } catch (error: unknown) {

        console.error(
            "Get all agents error:",
            error,
        );

        res.status(500).json({
            error: {
                code: "AGENTS_FETCH_FAILED",
                message: "Failed to load agents.",
            },
        });
    }
}