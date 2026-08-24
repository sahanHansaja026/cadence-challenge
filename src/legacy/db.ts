import 'dotenv/config';
import { Pool } from 'pg';

let pool: Pool | undefined;

/**
 * Lazily-created PostgreSQL connection pool.
 *
 * The pool is not created when this module is imported.
 * It is created only when getPool() is called.
 */
export function getPool(): Pool {
  if (!pool) {
    const connectionString =
      process.env.DATABASE_URL;

    if (!connectionString) {
      throw new Error(
        'DATABASE_URL is not set. Copy .env.example to .env first.',
      );
    }

    pool = new Pool({
      connectionString,
      max: 10,
    });
  }

  return pool;
}

/**
 * Closes the current connection pool.
 *
 * Safe to call when no pool has been created.
 */
export async function closePool(): Promise<void> {
  if (!pool) {
    return;
  }

  const currentPool = pool;

  pool = undefined;

  await currentPool.end();
}