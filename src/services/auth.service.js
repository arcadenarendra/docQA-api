
import { pool } from '../db/pool.js';
import { hashPassword } from '../utils/password.js';

export async function registerUser({ email, password }) {
    const existingUser = await pool.query(
        'SELECT id FROM users WHERE email = $1',
        [email]
    );

    if (existingUser.rows.length > 0) {
        const error = new Error('Email is already registered');
        error.statusCode = 409;
        throw error;
    }

    if (Buffer.byteLength(password, 'utf8') > 72) {
        const error = new Error('Password is too long');
        error.statusCode = 400;
        throw error;
    }

    const passwordHash = await hashPassword(password);

    const result = await pool.query(
        `INSERT INTO users (email, password_hash)
         VALUES ($1, $2)
         RETURNING id, email, created_at`,
        [email, passwordHash]
    );

    return result.rows[0];
}
