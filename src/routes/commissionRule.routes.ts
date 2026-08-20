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


const router = Router();


/*
 * GET /api/commission-rules
 *
 * COMPANY_ADMIN:
 *     Can view commission rules.
 *
 * FINANCE:
 *     Can view commission rules.
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
 *
 * COMPANY_ADMIN:
 *     Can view one commission rule.
 *
 * FINANCE:
 *     Can view one commission rule.
 *
 * AGENT:
 *     Cannot access.
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
 * Only COMPANY_ADMIN can create
 * commission rules.
 *
 * PRODUCT_OVERRIDE is a commission-rule
 * type. It does NOT mean an authorization
 * override.
 */
router.post(
    "/",
    authenticate,
    requireRole(
        "COMPANY_ADMIN",
    ),
    createCommissionRuleController,
);


/*
 * PATCH /api/commission-rules/:id
 *
 * Only COMPANY_ADMIN can update
 * commission rules.
 */
router.patch(
    "/:id",
    authenticate,
    requireRole(
        "COMPANY_ADMIN",
    ),
    updateCommissionRuleController,
);


/*
 * DELETE /api/commission-rules/:id
 *
 * Only COMPANY_ADMIN can delete
 * commission rules.
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