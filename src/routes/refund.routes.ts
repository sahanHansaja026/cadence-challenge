import {
    Router,
} from "express";

import {
    authenticate,
} from "../middleware/auth.middleware";

import {
    requireRole,
} from "../middleware/role.middleware";

import {
    getRefundsController,
    getRefundController,
    createRefundController,
    updateRefundStatusController,
} from "../controllers/refund.controller";


const router =
    Router();


/*
 * View all refunds.
 *
 * COMPANY_ADMIN / FINANCE
 */
router.get(
    "/",
    authenticate,
    requireRole(
        "COMPANY_ADMIN",
        "FINANCE",
    ),
    getRefundsController,
);


/*
 * View one refund.
 *
 * COMPANY_ADMIN / FINANCE
 */
router.get(
    "/:id",
    authenticate,
    requireRole(
        "COMPANY_ADMIN",
        "FINANCE",
    ),
    getRefundController,
);


/*
 * Create refund.
 *
 * COMPANY_ADMIN / FINANCE
 */
router.post(
    "/",
    authenticate,
    requireRole(
        "COMPANY_ADMIN",
        "FINANCE",
    ),
    createRefundController,
);


/*
 * Process / cancel refund.
 *
 * COMPANY_ADMIN / FINANCE
 */
router.patch(
    "/:id/status",
    authenticate,
    requireRole(
        "COMPANY_ADMIN",
        "FINANCE",
    ),
    updateRefundStatusController,
);


export default router;