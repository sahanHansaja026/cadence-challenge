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
    getAdminFinancialReportController,
    getFinanceFinancialReportController,
    getAgentFinancialReportController,
} from "../controllers/report.controller";


const router = Router();


/*
 * =========================================================
 * ADMIN FINANCIAL REPORT
 * =========================================================
 */

router.get(
    "/admin/financial",
    authenticate,
    requireRole("COMPANY_ADMIN"),
    getAdminFinancialReportController,
);


/*
 * =========================================================
 * FINANCE FINANCIAL REPORT
 * =========================================================
 */

router.get(
    "/finance/financial",
    authenticate,
    requireRole("FINANCE"),
    getFinanceFinancialReportController,
);


/*
 * =========================================================
 * AGENT FINANCIAL REPORT
 * =========================================================
 */

router.get(
    "/agent/financial",
    authenticate,
    requireRole("AGENT"),
    getAgentFinancialReportController,
);


/*
 * =========================================================
 * AGENT STATEMENT
 * =========================================================
 */

router.get(
    "/agent/statement",
    authenticate,
    requireRole("AGENT"),
    getAgentStatementController,
);


/*
 * =========================================================
 * COMPANY SUMMARY
 * =========================================================
 *
 * Existing endpoint.
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
 * ALL AGENT REPORTS
 * =========================================================
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
 * SPECIFIC AGENT STATEMENT
 * =========================================================
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