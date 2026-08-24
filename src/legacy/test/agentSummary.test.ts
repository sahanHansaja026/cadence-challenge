import { describe, expect, it } from 'vitest';

import type { BookingRecord } from '../bookingRepository';
import { summariseAgent } from '../agentSummary';


describe('summariseAgent', () => {
    it('calculates gross and commission for bookings in the requested period', () => {
        const bookings: BookingRecord[] = [
            {
                id: 'booking-1',
                external_ref: 'BOOK-001',
                agent_code: 'AG001',
                booking_date: '2026-04-03',
                amount: '100.00',
                product_code: 'P001',
            },
            {
                id: 'booking-2',
                external_ref: 'BOOK-002',
                agent_code: 'AG001',
                booking_date: '2026-04-10',
                amount: '200.00',
                product_code: 'P001',
            },
            {
                id: 'booking-3',
                external_ref: 'BOOK-003',
                agent_code: 'AG001',
                booking_date: '2026-05-01',
                amount: '500.00',
                product_code: 'P001',
            },
        ];

        const result = summariseAgent(
            'AG001',
            bookings,
            0.10,
            '2026-04-01',
            '2026-04-30',
        );

        expect(result.bookingCount).toBe(2);
        expect(result.gross).toBe(300);
        expect(result.commission).toBe(30);
    });
});