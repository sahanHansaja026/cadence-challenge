import { randomUUID } from "crypto";
import { query } from "../db/client";

export async function createPayoutRun(
    companyId: string,
    periodStart: string,
    periodEnd: string,
) {
    // Get next run number for this company
    const runNumberResult = await query<{
        next_run_no: number;
    }>(
        `
        SELECT COALESCE(MAX(run_no), 0) + 1 AS next_run_no
        FROM payout_runs
        WHERE company_id = $1
        `,
        [companyId],
    );

    const runNo =
        Number(runNumberResult[0]?.next_run_no ?? 1);

    const id = `run_${randomUUID()}`;

    const result = await query<{
        id: string;
        company_id: string;
        run_no: number;
        period_start: string;
        period_end: string;
        status: "DRAFT" | "FINALISED";
        total_amount: string;
        created_at: Date;
    }>(
        `
        INSERT INTO payout_runs (
            id,
            company_id,
            run_no,
            period_start,
            period_end,
            status,
            total_amount
        )
        VALUES (
            $1,
            $2,
            $3,
            $4,
            $5,
            'DRAFT',
            0
        )
        RETURNING
            id,
            company_id,
            run_no,
            period_start,
            period_end,
            status,
            total_amount,
            created_at
        `,
        [
            id,
            companyId,
            runNo,
            periodStart,
            periodEnd,
        ],
    );

    return result[0];
}

// get payout run
export async function getPayoutRuns(
    companyId: string,
) {
    return query(
        `
        SELECT
            id,
            company_id,
            run_no,
            period_start,
            period_end,
            status,
            total_amount,
            created_at
        FROM payout_runs
        WHERE company_id = $1
        ORDER BY created_at DESC
        `,
        [companyId],
    );
}

// get one payout run
export async function getPayoutRunById(
    payoutRunId: string,
    companyId: string,
) {
    const result = await query(
        `
        SELECT
            id,
            company_id,
            run_no,
            period_start,
            period_end,
            status,
            total_amount,
            created_at
        FROM payout_runs
        WHERE id = $1
          AND company_id = $2
        `,
        [
            payoutRunId,
            companyId,
        ],
    );

    return result[0] ?? null;
}