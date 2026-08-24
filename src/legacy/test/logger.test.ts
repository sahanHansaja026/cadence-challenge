import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { logger } from '../logger';

describe('logger', () => {
    let consoleSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
        consoleSpy = vi
            .spyOn(console, 'log')
            .mockImplementation(() => { });
    });

    afterEach(() => {
        consoleSpy.mockRestore();
        delete process.env.LOG_LEVEL;
    });

    it('should log info messages by default', () => {
        delete process.env.LOG_LEVEL;

        logger.info('test message');

        expect(consoleSpy).toHaveBeenCalledTimes(1);

        const output = JSON.parse(
            consoleSpy.mock.calls[0]?.[0] as string,
        );

        expect(output.level).toBe('info');
        expect(output.message).toBe('test message');
        expect(output.ts).toBeDefined();
    });

    it('should include context in the log output', () => {
        logger.info('booking created', {
            bookingId: 'BOOK-001',
            companyId: 'company-a',
        });

        const output = JSON.parse(
            consoleSpy.mock.calls[0]?.[0] as string,
        );

        expect(output).toMatchObject({
            level: 'info',
            message: 'booking created',
            bookingId: 'BOOK-001',
            companyId: 'company-a',
        });
    });

    it('should suppress debug messages when LOG_LEVEL is info', () => {
        process.env.LOG_LEVEL = 'info';

        logger.debug('debug message');

        expect(consoleSpy).not.toHaveBeenCalled();
    });

    it('should log debug messages when LOG_LEVEL is debug', () => {
        process.env.LOG_LEVEL = 'debug';

        logger.debug('debug message');

        expect(consoleSpy).toHaveBeenCalledTimes(1);

        const output = JSON.parse(
            consoleSpy.mock.calls[0]?.[0] as string,
        );

        expect(output.level).toBe('debug');
        expect(output.message).toBe('debug message');
    });

    it('should suppress info messages when LOG_LEVEL is warn', () => {
        process.env.LOG_LEVEL = 'warn';

        logger.info('info message');

        expect(consoleSpy).not.toHaveBeenCalled();
    });

    it('should log warn and error messages when LOG_LEVEL is warn', () => {
        process.env.LOG_LEVEL = 'warn';

        logger.warn('warning');
        logger.error('error');

        expect(consoleSpy).toHaveBeenCalledTimes(2);
    });

    it('should fall back to info for an invalid LOG_LEVEL', () => {
        process.env.LOG_LEVEL = 'invalid';

        logger.debug('debug message');
        logger.info('info message');

        expect(consoleSpy).toHaveBeenCalledTimes(1);

        const output = JSON.parse(
            consoleSpy.mock.calls[0]?.[0] as string,
        );

        expect(output.level).toBe('info');
    });
});