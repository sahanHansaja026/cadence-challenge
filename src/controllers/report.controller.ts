import type {
    Request,
    Response,
} from "express";

import {
    getAgentStatement,
    getCompanyReportSummary,
    getAgentReports,
    getAgentStatementByCode,
} from "../services/report.service";


/*
 * =========================================================
 * AGENT STATEMENT
 * =========================================================
 *
 * GET /api/reports/agent/statement
 */
export async function getAgentStatementController(
    req: Request,
    res: Response,
): Promise<void> {

    if (!req.user) {

        res.status(401).json({
            error: {
                code: "UNAUTHORIZED",
                message:
                    "Authentication required.",
            },
        });

        return;
    }


    try {

        const statement =
            await getAgentStatement(
                req.user.companyId,
                req.user.userId,
            );


        res.status(200).json({
            data: {
                statement,
            },
        });

    } catch (error: unknown) {

        console.error(
            "Get agent statement error:",
            error,
        );


        res.status(500).json({
            error: {
                code:
                    "INTERNAL_SERVER_ERROR",
                message:
                    "Something went wrong.",
            },
        });
    }
}


/*
 * =========================================================
 * COMPANY SUMMARY
 * =========================================================
 *
 * GET /api/reports/summary
 *
 * COMPANY_ADMIN / FINANCE
 */
export async function getCompanyReportSummaryController(
    req: Request,
    res: Response,
): Promise<void> {

    if (!req.user) {

        res.status(401).json({
            error: {
                code: "UNAUTHORIZED",
                message:
                    "Authentication required.",
            },
        });

        return;
    }


    try {

        const summary =
            await getCompanyReportSummary(
                req.user.companyId,
            );


        res.status(200).json({
            data: {
                summary,
            },
        });

    } catch (error: unknown) {

        console.error(
            "Get company report summary error:",
            error,
        );


        res.status(500).json({
            error: {
                code:
                    "INTERNAL_SERVER_ERROR",
                message:
                    "Something went wrong.",
            },
        });
    }
}


/*
 * =========================================================
 * AGENT REPORTS
 * =========================================================
 *
 * GET /api/reports/agents
 *
 * COMPANY_ADMIN / FINANCE
 */
export async function getAgentReportsController(
    req: Request,
    res: Response,
): Promise<void> {

    if (!req.user) {

        res.status(401).json({
            error: {
                code: "UNAUTHORIZED",
                message:
                    "Authentication required.",
            },
        });

        return;
    }


    try {

        const agents =
            await getAgentReports(
                req.user.companyId,
            );


        res.status(200).json({
            data: {
                agents,
            },
        });

    } catch (error: unknown) {

        console.error(
            "Get agent reports error:",
            error,
        );


        res.status(500).json({
            error: {
                code:
                    "INTERNAL_SERVER_ERROR",
                message:
                    "Something went wrong.",
            },
        });
    }
}


/*
 * =========================================================
 * SPECIFIC AGENT STATEMENT
 * =========================================================
 *
 * GET /api/reports/agents/:agentCode/statement
 *
 * COMPANY_ADMIN / FINANCE
 */
export async function getAgentStatementByCodeController(
    req: Request,
    res: Response,
): Promise<void> {

    if (!req.user) {

        res.status(401).json({
            error: {
                code: "UNAUTHORIZED",
                message:
                    "Authentication required.",
            },
        });

        return;
    }


    const agentCode =
        req.params.agentCode;


    if (
        !agentCode ||
        Array.isArray(agentCode)
    ) {

        res.status(400).json({
            error: {
                code:
                    "INVALID_AGENT_CODE",
                message:
                    "Invalid agent code.",
            },
        });

        return;
    }


    try {

        const statement =
            await getAgentStatementByCode(
                req.user.companyId,
                agentCode,
            );


        res.status(200).json({
            data: {
                statement,
            },
        });

    } catch (error: unknown) {

        console.error(
            "Get agent statement by code error:",
            error,
        );


        res.status(500).json({
            error: {
                code:
                    "INTERNAL_SERVER_ERROR",
                message:
                    "Something went wrong.",
            },
        });
    }
}