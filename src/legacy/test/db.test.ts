import { afterEach, describe, expect, it } from 'vitest';
import { closePool, getPool } from '../db';

describe('database pool', () => {
    afterEach(async () => {
        await closePool();

        delete process.env.DATABASE_URL;
    });

    it('should throw when DATABASE_URL is not configured', () => {
        delete process.env.DATABASE_URL;

        expect(() => getPool()).toThrow(
            'DATABASE_URL is not set. Copy .env.example to .env first.',
        );
    });

    it('should create a pool when DATABASE_URL is configured', () => {
        process.env.DATABASE_URL =
            'postgresql://test:test@localhost:5433/test';

        const pool = getPool();

        expect(pool).toBeDefined();
    });

    it('should return the same pool instance for repeated calls', () => {
        process.env.DATABASE_URL =
            'postgresql://test:test@localhost:5433/test';

        const pool1 = getPool();
        const pool2 = getPool();

        expect(pool1).toBe(pool2);
    });

    it('should create a new pool after the previous pool is closed', async () => {
        process.env.DATABASE_URL =
            'postgresql://test:test@localhost:5433/test';

        const pool1 = getPool();

        await closePool();

        const pool2 = getPool();

        expect(pool2).toBeDefined();
        expect(pool2).not.toBe(pool1);
    });

    it('should safely close when no pool exists', async () => {
        await expect(
            closePool(),
        ).resolves.toBeUndefined();
    });
});