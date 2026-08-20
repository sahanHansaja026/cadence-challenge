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
} from "../controllers/agent.controller";

const router =
    Router();


/*
 * Get my agent profile
 */
router.get(
    "/me",
    authenticate,
    requireRole("AGENT"),
    getMyAgentController,
);


/*
 * Create my agent profile
 */
router.post(
    "/me",
    authenticate,
    requireRole("AGENT"),
    createMyAgentController,
);


/*
 * Update my agent profile
 */
router.patch(
    "/me",
    authenticate,
    requireRole("AGENT"),
    updateMyAgentController,
);


export default router;