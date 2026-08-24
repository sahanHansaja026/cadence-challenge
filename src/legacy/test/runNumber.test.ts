import { describe, expect, it, vi } from 'vitest';
import { createPayoutRun } from '../runNumber';

describe('createPayoutRun', () => {
    it('should generate different run numbers when a concurrent insert causes a collision', async () => {
        let nextRunNumber = 6;
        let insertAttempts = 0;

        const query = vi.fn(async (sql: string) => {
            // nextRunNumber()
            if (
                sql.includes(
                    'COALESCE(MAX(run_no), 0) + 1',
                )
            ) {
                return {
                    rows: [
                        {
                            next: String(nextRunNumber),
                        },
                    ],
                };
            }

            // INSERT payout run
            if (
                sql.includes(
                    'INSERT INTO payout_runs',
                )
            ) {
                insertAttempts++;

                // First request gets run 6.
                if (insertAttempts === 1) {
                    nextRunNumber = 7;

                    return {
                        rows: [],
                    };
                }

                // Second request initially also tried run 6.
                // Simulate PostgreSQL unique constraint violation.
                if (insertAttempts === 2) {
                    const error = new Error(
                        'duplicate key value violates unique constraint',
                    ) as Error & {
                        code: string;
                    };

                    error.code = '23505';

                    throw error;
                }

                // Retry gets run 7.
                if (insertAttempts === 3) {
                    return {
                        rows: [],
                    };
                }
            }

            return {
                rows: [],
            };
        });

        const pool = {
            query,
        } as any;

        const [run1, run2] = await Promise.all([
            createPayoutRun(
                pool,
                'company-a',
                '2026-04-01',
                '2026-04-30',
            ),

            createPayoutRun(
                pool,
                'company-a',
                '2026-05-01',
                '2026-05-31',
            ),
        ]);

        expect(run1.runNo).not.toBe(run2.runNo);

        expect(
            [run1.runNo, run2.runNo].sort(
                (a, b) => a - b,
            ),
        ).toEqual([6, 7]);
    });
});