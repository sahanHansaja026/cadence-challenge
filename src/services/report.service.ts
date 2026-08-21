import { query } from "../db/client";


/*
 * =========================================================
 * TYPES
 * =========================================================
 */

export interface AgentStatementRow {
    payout_run_id: string;
    run_no: number;
    period_start: string;
    period_end: string;
    status: "DRAFT" | "FINALISED";

    agent_code: string;

    booking_count: number;
    gross_volume: string;
    commission_rate: string;
    commission_amount: string;
}


export interface ReportSummary {
    booking_count: number;
    gross_volume: string;
    commission_amount: string;
    payout_run_count: number;
}


export interface AgentReport {
    agent_code: string;
    full_name: string;
    booking_count: number;
    gross_volume: string;
    commission_amount: string;
}


/*
 * =========================================================
 * ADMIN REPORT
 * =========================================================
 */

export interface AdminFinancialReport {

    totalUsers: number;

    totalAgents: number;

    totalFinanceUsers: number;

    totalCommissionRules: number;

    activeCommissionRules: number;

    totalBookings: number;

    grossVolume: string;

    totalCommission: string;

    totalPayoutRuns: number;

    finalisedPayoutRuns: number;

    draftPayoutRuns: number;
}


/*
 * =========================================================
 * FINANCE REPORT
 * =========================================================
 */

export interface FinanceFinancialReport {

    totalBookings: number;

    grossVolume: string;

    totalCommission: string;

    totalAgents: number;

    totalCommissionRules: number;

    activeCommissionRules: number;

    totalPayoutRuns: number;

    finalisedPayoutRuns: number;

    draftPayoutRuns: number;
}


/*
 * =========================================================
 * AGENT REPORT
 * =========================================================
 */

export interface AgentFinancialReport {

    bookingCount: number;

    grossVolume: string;

    totalCommission: string;

    payoutRunCount: number;
}


/*
 * =========================================================
 * ADMIN FINANCIAL REPORT
 * =========================================================
 *
 * COMPANY_ADMIN only.
 *
 * Does NOT return:
 *
 * - override volume
 * - override commission
 * - override details
 * - payout line items
 */

export async function getAdminFinancialReport(
    companyId: string,
): Promise<AdminFinancialReport> {

    const result =
        await query<{
            total_users: string;
            total_agents: string;
            total_finance_users: string;
            total_commission_rules: string;
            active_commission_rules: string;
            total_bookings: string;
            gross_volume: string;
            total_commission: string;
            total_payout_runs: string;
            finalised_payout_runs: string;
            draft_payout_runs: string;
        }>(
            `
            SELECT

                (
                    SELECT COUNT(*)
                    FROM users
                    WHERE company_id = $1
                ) AS total_users,

                (
                    SELECT COUNT(*)
                    FROM agents
                    WHERE company_id = $1
                ) AS total_agents,

                (
                    SELECT COUNT(*)
                    FROM users
                    WHERE company_id = $1
                    AND role = 'FINANCE'
                ) AS total_finance_users,

                (
                    SELECT COUNT(*)
                    FROM commission_rules
                    WHERE company_id = $1
                ) AS total_commission_rules,

                (
                    SELECT COUNT(*)
                    FROM commission_rules
                    WHERE company_id = $1
                    AND effective_from <= CURRENT_DATE
                    AND (
                        effective_to IS NULL
                        OR effective_to >= CURRENT_DATE
                    )
                ) AS active_commission_rules,

                (
                    SELECT COUNT(*)
                    FROM bookings
                    WHERE company_id = $1
                ) AS total_bookings,

                (
                    SELECT COALESCE(
                        SUM(amount),
                        0
                    )
                    FROM bookings
                    WHERE company_id = $1
                ) AS gross_volume,

                (
                    SELECT COALESCE(
                        SUM(total_amount),
                        0
                    )
                    FROM payout_runs
                    WHERE company_id = $1
                ) AS total_commission,

                (
                    SELECT COUNT(*)
                    FROM payout_runs
                    WHERE company_id = $1
                ) AS total_payout_runs,

                (
                    SELECT COUNT(*)
                    FROM payout_runs
                    WHERE company_id = $1
                    AND status = 'FINALISED'
                ) AS finalised_payout_runs,

                (
                    SELECT COUNT(*)
                    FROM payout_runs
                    WHERE company_id = $1
                    AND status = 'DRAFT'
                ) AS draft_payout_runs
            `,
            [
                companyId,
            ],
        );


    const row =
        result[0];


    return {

        totalUsers:
            Number(
                row?.total_users ?? 0,
            ),

        totalAgents:
            Number(
                row?.total_agents ?? 0,
            ),

        totalFinanceUsers:
            Number(
                row?.total_finance_users ?? 0,
            ),

        totalCommissionRules:
            Number(
                row?.total_commission_rules ?? 0,
            ),

        activeCommissionRules:
            Number(
                row?.active_commission_rules ?? 0,
            ),

        totalBookings:
            Number(
                row?.total_bookings ?? 0,
            ),

        grossVolume:
            row?.gross_volume ?? "0.00",

        totalCommission:
            row?.total_commission ?? "0.00",

        totalPayoutRuns:
            Number(
                row?.total_payout_runs ?? 0,
            ),

        finalisedPayoutRuns:
            Number(
                row?.finalised_payout_runs ?? 0,
            ),

        draftPayoutRuns:
            Number(
                row?.draft_payout_runs ?? 0,
            ),
    };
}


/*
 * =========================================================
 * FINANCE FINANCIAL REPORT
 * =========================================================
 *
 * FINANCE only.
 *
 * Does not expose:
 *
 * - override volume
 * - override commission
 * - override details
 * - user management information
 */

export async function getFinanceFinancialReport(
    companyId: string,
): Promise<FinanceFinancialReport> {

    const result =
        await query<{
            total_bookings: string;
            gross_volume: string;
            total_commission: string;
            total_agents: string;
            total_commission_rules: string;
            active_commission_rules: string;
            total_payout_runs: string;
            finalised_payout_runs: string;
            draft_payout_runs: string;
        }>(
            `
            SELECT

                (
                    SELECT COUNT(*)
                    FROM bookings
                    WHERE company_id = $1
                ) AS total_bookings,

                (
                    SELECT COALESCE(
                        SUM(amount),
                        0
                    )
                    FROM bookings
                    WHERE company_id = $1
                ) AS gross_volume,

                (
                    SELECT COALESCE(
                        SUM(total_amount),
                        0
                    )
                    FROM payout_runs
                    WHERE company_id = $1
                ) AS total_commission,

                (
                    SELECT COUNT(*)
                    FROM agents
                    WHERE company_id = $1
                ) AS total_agents,

                (
                    SELECT COUNT(*)
                    FROM commission_rules
                    WHERE company_id = $1
                ) AS total_commission_rules,

                (
                    SELECT COUNT(*)
                    FROM commission_rules
                    WHERE company_id = $1
                    AND effective_from <= CURRENT_DATE
                    AND (
                        effective_to IS NULL
                        OR effective_to >= CURRENT_DATE
                    )
                ) AS active_commission_rules,

                (
                    SELECT COUNT(*)
                    FROM payout_runs
                    WHERE company_id = $1
                ) AS total_payout_runs,

                (
                    SELECT COUNT(*)
                    FROM payout_runs
                    WHERE company_id = $1
                    AND status = 'FINALISED'
                ) AS finalised_payout_runs,

                (
                    SELECT COUNT(*)
                    FROM payout_runs
                    WHERE company_id = $1
                    AND status = 'DRAFT'
                ) AS draft_payout_runs
            `,
            [
                companyId,
            ],
        );


    const row =
        result[0];


    return {

        totalBookings:
            Number(
                row?.total_bookings ?? 0,
            ),

        grossVolume:
            row?.gross_volume ?? "0.00",

        totalCommission:
            row?.total_commission ?? "0.00",

        totalAgents:
            Number(
                row?.total_agents ?? 0,
            ),

        totalCommissionRules:
            Number(
                row?.total_commission_rules ?? 0,
            ),

        activeCommissionRules:
            Number(
                row?.active_commission_rules ?? 0,
            ),

        totalPayoutRuns:
            Number(
                row?.total_payout_runs ?? 0,
            ),

        finalisedPayoutRuns:
            Number(
                row?.finalised_payout_runs ?? 0,
            ),

        draftPayoutRuns:
            Number(
                row?.draft_payout_runs ?? 0,
            ),
    };
}


/*
 * =========================================================
 * AGENT FINANCIAL REPORT
 * =========================================================
 *
 * AGENT only.
 *
 * Returns only the authenticated agent's
 * own information.
 */

export async function getAgentFinancialReport(
    companyId: string,
    userId: string,
): Promise<AgentFinancialReport> {

    const result =
        await query<{
            booking_count: string;
            gross_volume: string;
            total_commission: string;
            payout_run_count: string;
        }>(
            `
            SELECT

                (
                    SELECT COUNT(*)
                    FROM bookings b
                    INNER JOIN agents a
                        ON a.agent_code = b.agent_code
                       AND a.company_id = b.company_id
                    WHERE a.user_id = $1
                    AND b.company_id = $2
                ) AS booking_count,

                (
                    SELECT COALESCE(
                        SUM(b.amount),
                        0
                    )
                    FROM bookings b
                    INNER JOIN agents a
                        ON a.agent_code = b.agent_code
                       AND a.company_id = b.company_id
                    WHERE a.user_id = $1
                    AND b.company_id = $2
                ) AS gross_volume,

                (
                    SELECT COALESCE(
                        SUM(pli.commission_amount),
                        0
                    )
                    FROM payout_line_items pli
                    INNER JOIN agents a
                        ON a.agent_code = pli.agent_code
                    INNER JOIN payout_runs pr
                        ON pr.id = pli.payout_run_id
                    WHERE a.user_id = $1
                    AND a.company_id = $2
                    AND pr.company_id = $2
                ) AS total_commission,

                (
                    SELECT COUNT(DISTINCT pr.id)
                    FROM payout_line_items pli
                    INNER JOIN agents a
                        ON a.agent_code = pli.agent_code
                    INNER JOIN payout_runs pr
                        ON pr.id = pli.payout_run_id
                    WHERE a.user_id = $1
                    AND a.company_id = $2
                    AND pr.company_id = $2
                ) AS payout_run_count
            `,
            [
                userId,
                companyId,
            ],
        );


    const row =
        result[0];


    return {

        bookingCount:
            Number(
                row?.booking_count ?? 0,
            ),

        grossVolume:
            row?.gross_volume ?? "0.00",

        totalCommission:
            row?.total_commission ?? "0.00",

        payoutRunCount:
            Number(
                row?.payout_run_count ?? 0,
            ),
    };
}


/*
 * =========================================================
 * EXISTING AGENT STATEMENT
 * =========================================================
 */

export async function getAgentStatement(
    companyId: string,
    userId: string,
): Promise<AgentStatementRow[]> {

    return await query<AgentStatementRow>(
        `
        SELECT
            pr.id AS payout_run_id,
            pr.run_no,
            pr.period_start,
            pr.period_end,
            pr.status,

            pli.agent_code,
            pli.booking_count,
            pli.gross_volume,
            pli.commission_rate,
            pli.commission_amount

        FROM agents a

        INNER JOIN payout_line_items pli
            ON pli.agent_code = a.agent_code

        INNER JOIN payout_runs pr
            ON pr.id = pli.payout_run_id

        WHERE a.user_id = $1
          AND a.company_id = $2
          AND pr.company_id = $2

        ORDER BY
            pr.period_start DESC,
            pr.created_at DESC
        `,
        [
            userId,
            companyId,
        ],
    );
}


/*
 * =========================================================
 * EXISTING COMPANY SUMMARY
 * =========================================================
 */

export interface AdminReportSummary {

    total_users: number;

    total_agents: number;

    total_finance_users: number;

    total_commission_rules: number;

    active_commission_rules: number;

    total_bookings: number;

    gross_volume: string;

    total_commission: string;
}


export async function getCompanyReportSummary(
    companyId: string,
): Promise<AdminReportSummary> {

    /*
     * =========================================================
     * USERS
     * =========================================================
     */

    const userResult =
        await query<{
            total_users: string;
            total_finance_users: string;
        }>(
            `
            SELECT

                COUNT(*) AS total_users,

                COUNT(
                    CASE
                        WHEN role = 'FINANCE'
                        THEN 1
                    END
                ) AS total_finance_users

            FROM users

            WHERE company_id = $1
            `,
            [
                companyId,
            ],
        );


    /*
     * =========================================================
     * AGENTS
     * =========================================================
     */

    const agentResult =
        await query<{
            total_agents: string;
        }>(
            `
            SELECT
                COUNT(*) AS total_agents

            FROM agents

            WHERE company_id = $1
            `,
            [
                companyId,
            ],
        );


    /*
     * =========================================================
     * COMMISSION RULES
     * =========================================================
     */

    const commissionRuleResult =
        await query<{
            total_commission_rules: string;
            active_commission_rules: string;
        }>(
            `
            SELECT

                COUNT(*) AS total_commission_rules,

                COUNT(
                    CASE
                        WHEN effective_from <= CURRENT_DATE
                        AND (
                            effective_to IS NULL
                            OR effective_to >= CURRENT_DATE
                        )
                        THEN 1
                    END
                ) AS active_commission_rules

            FROM commission_rules

            WHERE company_id = $1
            `,
            [
                companyId,
            ],
        );


    /*
     * =========================================================
     * BOOKINGS
     * =========================================================
     */

    const bookingResult =
        await query<{
            total_bookings: string;
            gross_volume: string;
        }>(
            `
            SELECT

                COUNT(*) AS total_bookings,

                COALESCE(
                    SUM(amount),
                    0
                ) AS gross_volume

            FROM bookings

            WHERE company_id = $1
            `,
            [
                companyId,
            ],
        );


    /*
     * =========================================================
     * COMMISSION
     * =========================================================
     *
     * Commission is taken from payout line items.
     *
     * Only payout runs belonging to this company
     * are included.
     */

    const commissionResult =
        await query<{
            total_commission: string;
        }>(
            `
            SELECT

                COALESCE(
                    SUM(pli.commission_amount),
                    0
                ) AS total_commission

            FROM payout_line_items pli

            INNER JOIN payout_runs pr
                ON pr.id = pli.payout_run_id

            WHERE pr.company_id = $1
            `,
            [
                companyId,
            ],
        );


    /*
     * =========================================================
     * RETURN
     * =========================================================
     */

    return {

        total_users:
            Number(
                userResult[0]?.total_users ?? 0,
            ),

        total_agents:
            Number(
                agentResult[0]?.total_agents ?? 0,
            ),

        total_finance_users:
            Number(
                userResult[0]?.total_finance_users ?? 0,
            ),

        total_commission_rules:
            Number(
                commissionRuleResult[0]?.total_commission_rules ?? 0,
            ),

        active_commission_rules:
            Number(
                commissionRuleResult[0]?.active_commission_rules ?? 0,
            ),

        total_bookings:
            Number(
                bookingResult[0]?.total_bookings ?? 0,
            ),

        gross_volume:
            bookingResult[0]?.gross_volume ??
            "0.00",

        total_commission:
            commissionResult[0]?.total_commission ??
            "0.00",

    };
}


/*
 * =========================================================
 * EXISTING AGENT REPORTS
 * =========================================================
 */

export async function getAgentReports(
    companyId: string,
): Promise<AgentReport[]> {

    return await query<AgentReport>(
        `
        SELECT
            a.agent_code,
            a.full_name,

            COALESCE(
                COUNT(DISTINCT b.id),
                0
            )::integer AS booking_count,

            COALESCE(
                SUM(DISTINCT b.amount),
                0
            ) AS gross_volume,

            COALESCE(
                SUM(pli.commission_amount),
                0
            ) AS commission_amount

        FROM agents a

        LEFT JOIN bookings b
            ON b.company_id = a.company_id
           AND b.agent_code = a.agent_code

        LEFT JOIN payout_line_items pli
            ON pli.agent_code = a.agent_code

        LEFT JOIN payout_runs pr
            ON pr.id = pli.payout_run_id
           AND pr.company_id = a.company_id

        WHERE a.company_id = $1

        GROUP BY
            a.agent_code,
            a.full_name

        ORDER BY
            a.agent_code
        `,
        [
            companyId,
        ],
    );
}


/*
 * =========================================================
 * SPECIFIC AGENT STATEMENT
 * =========================================================
 */

export async function getAgentStatementByCode(
    companyId: string,
    agentCode: string,
): Promise<AgentStatementRow[]> {

    return await query<AgentStatementRow>(
        `
        SELECT
            pr.id AS payout_run_id,
            pr.run_no,
            pr.period_start,
            pr.period_end,
            pr.status,

            pli.agent_code,
            pli.booking_count,
            pli.gross_volume,
            pli.commission_rate,
            pli.commission_amount

        FROM payout_line_items pli

        INNER JOIN payout_runs pr
            ON pr.id = pli.payout_run_id

        INNER JOIN agents a
            ON a.agent_code = pli.agent_code
           AND a.company_id = pr.company_id

        WHERE pr.company_id = $1
          AND a.agent_code = $2

        ORDER BY
            pr.period_start DESC,
            pr.created_at DESC
        `,
        [
            companyId,
            agentCode,
        ],
    );
}