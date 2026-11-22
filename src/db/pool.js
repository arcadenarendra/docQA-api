
import pg from 'pg';
import { env } from '../config/env.js';

const { Pool } = pg;

export const pool = new Pool({
    connectionString: env.DATABASE_URL,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000
});

pool.on('error', (error) => {
    console.error('Unexpected database pool error:', error.message);
});

export async function checkDatabaseConnection() {
    const result = await pool.query(
        'SELECT NOW() AS current_time'
    );

    return result.rows[0];
}
