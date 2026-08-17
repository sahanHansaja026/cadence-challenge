import { Router } from "express";

import {
    authenticate,
} from "../middleware/auth.middleware";

import {
    requireRole,
} from "../middleware/role.middleware";

import {
    getCommissionRulesController,
    getCommissionRuleController,
    createCommissionRuleController,
    updateCommissionRuleController,
    deleteCommissionRuleController,
} from "../controllers/commissionRule.controller";


const router =
    Router();


/*
 * GET /api/commission-rules
 *
 * COMPANY_ADMIN:
 *     Can view rules.
 *
 * FINANCE:
 *     Can view rules.
 *
 * AGENT:
 *     Cannot access.
 */
router.get(
    "/",
    authenticate,
    requireRole(
        "COMPANY_ADMIN",
        "FINANCE",
    ),
    getCommissionRulesController,
);


/*
 * GET /api/commission-rules/:id
 */
router.get(
    "/:id",
    authenticate,
    requireRole(
        "COMPANY_ADMIN",
        "FINANCE",
    ),
    getCommissionRuleController,
);


/*
 * POST /api/commission-rules
 *
 * COMPANY_ADMIN:
 *     Can create.
 *
 * FINANCE:
 *     Can create.
 */
router.post(
    "/",
    authenticate,
    requireRole(
        "COMPANY_ADMIN",
        "FINANCE",
    ),
    createCommissionRuleController,
);


/*
 * PATCH /api/commission-rules/:id
 *
 * COMPANY_ADMIN:
 *     Can update.
 *
 * FINANCE:
 *     Can update.
 */
router.patch(
    "/:id",
    authenticate,
    requireRole(
        "COMPANY_ADMIN",
        "FINANCE",
    ),
    updateCommissionRuleController,
);


/*
 * DELETE /api/commission-rules/:id
 *
 * Only COMPANY_ADMIN can delete.
 */
router.delete(
    "/:id",
    authenticate,
    requireRole(
        "COMPANY_ADMIN",
    ),
    deleteCommissionRuleController,
);


export default router;