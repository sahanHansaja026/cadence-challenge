import { describe, expect, it, vi } from 'vitest';
import { findBookingsByAgentCode } from '../bookingRepository';


describe('findBookingsByAgentCode', () => {
    it('should only return bookings belonging to the requested company', async () => {
        const query = vi.fn().mockResolvedValue({
            rows: [
                {
                    id: 'booking-a',
                    external_ref: 'A-001',
                    agent_code: 'AG001',
                    booking_date: '2026-04-03',
                    amount: '100.00',
                    product_code: 'P001',
                },
                {
                    id: 'booking-b',
                    external_ref: 'B-001',
                    agent_code: 'AG001',
                    booking_date: '2026-04-04',
                    amount: '200.00',
                    product_code: 'P001',
                },
            ],
        });

        const pool = {
            query,
        } as any;

        const result = await findBookingsByAgentCode(
            pool,
            'company-a',
            'AG001',
        );

        expect(result).toHaveLength(1);
        expect(result[0]?.id).toBe('booking-a');

        expect(query).toHaveBeenCalledWith(
            expect.stringContaining('company_id'),
            ['company-a', 'AG001'],
        );
    });
});