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
 * AGENT STATEMENT
 * =========================================================
 *
 * Agent sees ONLY their own statement.
 *
 * Identification:
 *
 * userId
 *   ↓
 * agents.user_id
 *   ↓
 * agents.agent_code
 *   ↓
 * payout_line_items
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
 * COMPANY REPORT SUMMARY
 * =========================================================
 *
 * Used by COMPANY_ADMIN and FINANCE.
 */
export async function getCompanyReportSummary(
    companyId: string,
): Promise<ReportSummary> {

    const bookingResult =
        await query<{
            booking_count: string;
            gross_volume: string;
        }>(
            `
            SELECT

                COUNT(*)::integer
                    AS booking_count,

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


    const payoutResult =
        await query<{
            commission_amount: string;
        }>(
            `
            SELECT
                COALESCE(
                    SUM(total_amount),
                    0
                ) AS commission_amount

            FROM payout_runs

            WHERE company_id = $1
            `,
            [
                companyId,
            ],
        );


    const runResult =
        await query<{
            payout_run_count: string;
        }>(
            `
            SELECT
                COUNT(*)::integer
                    AS payout_run_count

            FROM payout_runs

            WHERE company_id = $1
            `,
            [
                companyId,
            ],
        );


    return {
        booking_count:
            Number(
                bookingResult[0]?.booking_count ?? 0,
            ),

        gross_volume:
            bookingResult[0]?.gross_volume ??
            "0.00",

        commission_amount:
            payoutResult[0]?.commission_amount ??
            "0.00",

        payout_run_count:
            Number(
                runResult[0]?.payout_run_count ?? 0,
            ),
    };
}


/*
 * =========================================================
 * AGENT REPORT
 * =========================================================
 *
 * Company-wide agent summary.
 *
 * Finance/Admin can see all agents
 * belonging to their company.
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
                SUM(b.amount),
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
 * STATEMENT FOR A SPECIFIC AGENT
 * =========================================================
 *
 * Used by Finance/Admin when viewing
 * an individual agent statement.
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