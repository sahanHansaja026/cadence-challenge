import { Router } from "express";

import {
    authenticate,
} from "../middleware/auth.middleware";

import {
    requireRole,
} from "../middleware/role.middleware";

import {
    getMyAgentController,
    createMyAgentController,
    updateMyAgentController,
    getAllAgentsController,
} from "../controllers/agent.controller";

const router = Router();


/*
 * =====================================================
 * ADMIN ROUTES
 * =====================================================
 */


/*
 * Get all agents in admin's company
 *
 * GET /api/agents
 */
router.get(
    "/",
    authenticate,
    requireRole("COMPANY_ADMIN"),
    getAllAgentsController,
);


/*
 * =====================================================
 * AGENT ROUTES
 * =====================================================
 */


/*
 * Get my agent profile
 *
 * GET /api/agents/me
 */
router.get(
    "/me",
    authenticate,
    requireRole("AGENT"),
    getMyAgentController,
);


/*
 * Create my agent profile
 *
 * POST /api/agents/me
 */
router.post(
    "/me",
    authenticate,
    requireRole("AGENT"),
    createMyAgentController,
);


/*
 * Update my agent profile
 *
 * PATCH /api/agents/me
 */
router.patch(
    "/me",
    authenticate,
    requireRole("AGENT"),
    updateMyAgentController,
);


export default router;