import { describe, expect, it, vi } from 'vitest';
import { createPayoutRun } from '../runNumber';

describe('createPayoutRun', () => {
    it('should generate different run numbers for concurrent payout runs', async () => {
        const query = vi.fn();

        // Both calls see the same current maximum.
        query
            .mockResolvedValueOnce({
                rows: [{ next: '6' }],
            })
            .mockResolvedValueOnce({
                rows: [{ next: '6' }],
            })
            .mockResolvedValueOnce({
                rows: [],
            })
            .mockResolvedValueOnce({
                rows: [],
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
    });
});