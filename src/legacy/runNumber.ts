import { randomUUID } from 'node:crypto';
import type { Pool } from 'pg';
import { logger } from './logger';

/**
 * Gets the next payout run number for a company.
 *
 * NOTE:
 * This function alone is not concurrency-safe.
 * createPayoutRun() protects the INSERT with the database
 * unique constraint and retries when a concurrent request
 * takes the same number.
 */
export async function nextRunNumber(
  pool: Pool,
  companyId: string,
): Promise<number> {
  const result = await pool.query<{ next: string }>(
    `
        SELECT COALESCE(MAX(run_no), 0) + 1 AS next
        FROM payout_runs
        WHERE company_id = $1
        `,
    [companyId],
  );

  return Number(result.rows[0]?.next ?? '1');
}

/**
 * Creates a payout run.
 *
 * Run numbers are unique per company.
 *
 * Concurrency is protected by the database UNIQUE constraint:
 *
 *   UNIQUE (company_id, run_no)
 *
 * If two requests calculate the same number, one INSERT succeeds
 * and the other receives a unique-constraint violation. The failed
 * request retries and gets the next number.
 */
export async function createPayoutRun(
  pool: Pool,
  companyId: string,
  periodStart: string,
  periodEnd: string,
): Promise<{ id: string; runNo: number }> {
  if (periodEnd < periodStart) {
    throw new Error('INVALID_PAYOUT_PERIOD');
  }

  const MAX_ATTEMPTS = 5;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const runNo = await nextRunNumber(pool, companyId);

    const id = `run_${randomUUID()}`;

    try {
      await pool.query(
        `
                INSERT INTO payout_runs (
                    id,
                    company_id,
                    run_no,
                    period_start,
                    period_end,
                    status
                )
                VALUES (
                    $1,
                    $2,
                    $3,
                    $4,
                    $5,
                    'DRAFT'
                )
                `,
        [
          id,
          companyId,
          runNo,
          periodStart,
          periodEnd,
        ],
      );

      logger.info('payout run created', {
        companyId,
        runNo,
        periodStart,
        periodEnd,
      });

      return {
        id,
        runNo,
      };
    } catch (error: unknown) {
      /**
       * PostgreSQL unique violation.
       *
       * 23505 = unique_violation
       */
      if (
        isPostgresUniqueViolation(error) &&
        attempt < MAX_ATTEMPTS
      ) {
        logger.warn(
          'payout run number collision, retrying',
          {
            companyId,
            runNo,
            attempt,
          },
        );

        continue;
      }

      throw error;
    }
  }

  throw new Error('PAYOUT_RUN_CREATION_FAILED');
}

/**
 * Checks whether a PostgreSQL error is a unique constraint violation.
 */
function isPostgresUniqueViolation(
  error: unknown,
): error is { code: string } {
  if (
    typeof error !== 'object' ||
    error === null
  ) {
    return false;
  }

  if (!('code' in error)) {
    return false;
  }

  return (
    (error as { code?: unknown }).code ===
    '23505'
  );
}