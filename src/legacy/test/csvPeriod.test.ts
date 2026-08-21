import { describe, expect, it } from 'vitest';
import { filterCsvRowsByPeriod } from '../csvPeriod';

describe('filterCsvRowsByPeriod', () => {
    it('should include a CSV row when its DD/MM/YYYY date is inside the period', () => {
        const rows = [
            {
                external_ref: 'BOOK-001',
                agent_code: 'AG001',
                date: '03/04/2026',
                amount: '100.00',
                product_code: 'P001',
            },
        ];

        const result = filterCsvRowsByPeriod(
            rows,
            '2026-04-01',
            '2026-04-30',
        );

        expect(result).toHaveLength(1);
        expect(result[0]?.external_ref).toBe('BOOK-001');
    });
});