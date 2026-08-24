import { describe, expect, it } from 'vitest';
import * as legacy from '../index';

describe('legacy public exports', () => {
    it('should export database helpers', () => {
        expect(legacy.getPool).toBeDefined();
        expect(legacy.closePool).toBeDefined();
    });

    it('should export pagination helpers', () => {
        expect(legacy.parsePageParams).toBeDefined();
        expect(legacy.toOffset).toBeDefined();
        expect(legacy.toPageMeta).toBeDefined();
    });

    it('should export booking repository functions', () => {
        expect(
            legacy.findBookingsByAgentCode,
        ).toBeDefined();

        expect(
            legacy.listBookingsForPeriod,
        ).toBeDefined();
    });

    it('should export agent summary functions', () => {
        expect(
            legacy.buildAgentSummary,
        ).toBeDefined();

        expect(
            legacy.summariseAgent,
        ).toBeDefined();
    });

    it('should export CSV helpers', () => {
        expect(
            legacy.filterCsvRowsByPeriod,
        ).toBeDefined();

        expect(
            legacy.countRowsInPeriod,
        ).toBeDefined();
    });

    it('should export payout run functions', () => {
        expect(
            legacy.createPayoutRun,
        ).toBeDefined();

        expect(
            legacy.nextRunNumber,
        ).toBeDefined();
    });

    it('should export logger', () => {
        expect(legacy.logger).toBeDefined();
    });
});