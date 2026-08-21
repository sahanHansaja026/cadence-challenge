import { Request, Response } from "express";

import {
    createTeamSchema,
    updateTeamSchema,
} from "../schemas/team.schema";

import {
    createTeam,
    getTeams,
    getTeamById,
    updateTeam,
    deleteTeam,
} from "../services/team.service";

/**
 * CREATE TEAM
 * POST /api/teams
 */
export async function createTeamController(
    req: Request,
    res: Response,
) {
    try {
        const parsed = createTeamSchema.safeParse(req.body);

        if (!parsed.success) {
            return res.status(400).json({
                message: "Invalid request data",
                errors: parsed.error.flatten(),
            });
        }

        const companyId = req.user?.companyId;

        if (!companyId) {
            return res.status(401).json({
                message: "Company information not found",
            });
        }

        const team = await createTeam({
            companyId,
            name: parsed.data.name,
            leadAgentId: parsed.data.leadAgentId,
            memberAgentIds: parsed.data.memberAgentIds,
        });

        return res.status(201).json({
            message: "Team created successfully",
            team,
        });
    } catch (error) {
        console.error("Create team error:", error);

        if (error instanceof Error) {
            return res.status(400).json({
                message: error.message,
            });
        }

        return res.status(500).json({
            message: "Failed to create team",
        });
    }
}


/**
 * GET ALL TEAMS
 * GET /api/teams
 */
export async function getTeamsController(
    req: Request,
    res: Response,
) {
    try {
        const companyId = req.user?.companyId;

        if (!companyId) {
            return res.status(401).json({
                message: "Company information not found",
            });
        }

        const teams = await getTeams(companyId);

        return res.status(200).json({
            teams,
        });
    } catch (error) {
        console.error("Get teams error:", error);

        return res.status(500).json({
            message: "Failed to get teams",
        });
    }
}


/**
 * GET ONE TEAM
 * GET /api/teams/:id
 */
export async function getTeamController(
    req: Request,
    res: Response,
) {
    try {
        const companyId = req.user?.companyId;
        const { id } = req.params;

        if (!companyId) {
            return res.status(401).json({
                message: "Company information not found",
            });
        }

        // Express may type params as string | string[]
        if (!id || Array.isArray(id)) {
            return res.status(400).json({
                message: "Invalid team ID",
            });
        }

        const team = await getTeamById(
            companyId,
            id,
        );

        return res.status(200).json({
            team,
        });
    } catch (error) {
        console.error("Get team error:", error);

        if (
            error instanceof Error &&
            error.message === "Team not found"
        ) {
            return res.status(404).json({
                message: "Team not found",
            });
        }

        return res.status(500).json({
            message: "Failed to get team",
        });
    }
}


/**
 * UPDATE TEAM
 * PATCH /api/teams/:id
 */
export async function updateTeamController(
    req: Request,
    res: Response,
) {
    try {
        const parsed = updateTeamSchema.safeParse(req.body);

        if (!parsed.success) {
            return res.status(400).json({
                message: "Invalid request data",
                errors: parsed.error.flatten(),
            });
        }

        const companyId = req.user?.companyId;
        const { id } = req.params;

        if (!companyId) {
            return res.status(401).json({
                message: "Company information not found",
            });
        }

        // Express may type params as string | string[]
        if (!id || Array.isArray(id)) {
            return res.status(400).json({
                message: "Invalid team ID",
            });
        }

        const team = await updateTeam({
            companyId,
            teamId: id,
            name: parsed.data.name,
            leadAgentId: parsed.data.leadAgentId,
            memberAgentIds: parsed.data.memberAgentIds,
        });

        return res.status(200).json({
            message: "Team updated successfully",
            team,
        });
    } catch (error) {
        console.error("Update team error:", error);

        if (error instanceof Error) {
            if (error.message === "Team not found") {
                return res.status(404).json({
                    message: "Team not found",
                });
            }

            return res.status(400).json({
                message: error.message,
            });
        }

        return res.status(500).json({
            message: "Failed to update team",
        });
    }
}


/**
 * DELETE TEAM
 * DELETE /api/teams/:id
 */
export async function deleteTeamController(
    req: Request,
    res: Response,
) {
    try {
        const companyId = req.user?.companyId;
        const { id } = req.params;

        if (!companyId) {
            return res.status(401).json({
                message: "Company information not found",
            });
        }

        // Express may type params as string | string[]
        if (!id || Array.isArray(id)) {
            return res.status(400).json({
                message: "Invalid team ID",
            });
        }

        await deleteTeam(
            companyId,
            id,
        );

        return res.status(200).json({
            message: "Team deleted successfully",
        });
    } catch (error) {
        console.error("Delete team error:", error);

        if (
            error instanceof Error &&
            error.message === "Team not found"
        ) {
            return res.status(404).json({
                message: "Team not found",
            });
        }

        return res.status(500).json({
            message: "Failed to delete team",
        });
    }
}