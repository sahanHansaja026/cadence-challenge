import { Router } from "express";

import {
    authenticate,
} from "../middleware/auth.middleware";

import {
    requireRole,
} from "../middleware/role.middleware";

import {
    createPayoutRunController,
    getPayoutRunsController,
    getPayoutRunController,
} from "../controllers/payout.controller";

const router = Router();

router.post(
    "/",
    authenticate,
    requireRole(
        "COMPANY_ADMIN",
        "FINANCE",
    ),
    createPayoutRunController,
);

router.get(
    "/",
    authenticate,
    requireRole(
        "COMPANY_ADMIN",
        "FINANCE",
    ),
    getPayoutRunsController,
);

router.get(
    "/:id",
    authenticate,
    requireRole(
        "COMPANY_ADMIN",
        "FINANCE",
    ),
    getPayoutRunController,
);

export default router;