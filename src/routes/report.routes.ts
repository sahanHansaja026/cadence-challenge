import { Router } from "express";

import {
    authenticate,
} from "../middleware/auth.middleware";

import {
    requireRole,
} from "../middleware/role.middleware";

import {
    getAgentStatementController,
    getCompanyReportSummaryController,
    getAgentReportsController,
    getAgentStatementByCodeController,
} from "../controllers/report.controller";


const router = Router();


/*
 * =========================================================
 * AGENT
 * =========================================================
 *
 * Agent can only see their own statement.
 */
router.get(
    "/agent/statement",
    authenticate,
    requireRole("AGENT"),
    getAgentStatementController,
);


/*
 * =========================================================
 * FINANCE + COMPANY ADMIN
 * =========================================================
 *
 * Company financial summary.
 */
router.get(
    "/summary",
    authenticate,
    requireRole(
        "COMPANY_ADMIN",
        "FINANCE",
    ),
    getCompanyReportSummaryController,
);


/*
 * =========================================================
 * FINANCE + COMPANY ADMIN
 * =========================================================
 *
 * All agents summary.
 */
router.get(
    "/agents",
    authenticate,
    requireRole(
        "COMPANY_ADMIN",
        "FINANCE",
    ),
    getAgentReportsController,
);


/*
 * =========================================================
 * FINANCE + COMPANY ADMIN
 * =========================================================
 *
 * Individual agent statement.
 */
router.get(
    "/agents/:agentCode/statement",
    authenticate,
    requireRole(
        "COMPANY_ADMIN",
        "FINANCE",
    ),
    getAgentStatementByCodeController,
);


export default router;