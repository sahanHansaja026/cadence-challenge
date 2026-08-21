import { Router } from "express";

import {
    createTeamController,
    getTeamsController,
    getTeamController,
    updateTeamController,
    deleteTeamController,
} from "../controllers/team.controller";

import { authenticate } from "../middleware/auth.middleware";

const router = Router();

router.post(
    "/",
    authenticate,
    createTeamController,
);

router.get(
    "/",
    authenticate,
    getTeamsController,
);

router.get(
    "/:id",
    authenticate,
    getTeamController,
);

router.patch(
    "/:id",
    authenticate,
    updateTeamController,
);

router.delete(
    "/:id",
    authenticate,
    deleteTeamController,
);

export default router;