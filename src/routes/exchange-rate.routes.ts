import { Router } from "express";

import {
    authenticate,
} from "../middleware/auth.middleware";

import {
    requireRole,
} from "../middleware/role.middleware";

import {
    createExchangeRateController,
    getExchangeRatesController,
} from "../controllers/exchange-rate.controller";

const router = Router();

/*
 * All authenticated users can view
 * exchange rates.
 */
router.get(
    "/",
    authenticate,
    getExchangeRatesController,
);

/*
 * Only Finance can create
 * exchange rates.
 */
router.post(
    "/",
    authenticate,
    requireRole("FINANCE"),
    createExchangeRateController,
);

export default router;