import { pool } from '../db/pool.js';
import { hashPassword, comparePassword } from '../utils/password.js';
import jwt from 'jsonwebtoken';

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


export async function loginUser({ email, password }) {
    const result = await pool.query(
        `SELECT id, email, password_hash
         FROM users
         WHERE email = $1`,
        [email]
    );

    const user = result.rows[0];

    if (!user) {
        const error = new Error('Invalid email or password');
        error.statusCode = 401;
        throw error;
    }

    const isPasswordValid = await comparePassword(
        password,
        user.password_hash
    );

    if (!isPasswordValid) {
        const error = new Error('Invalid email or password');
        error.statusCode = 401;
        throw error;
    }

    const secret = process.env.JWT_SECRET;

    if (!secret || secret.length < 32) {
        throw new Error('JWT_SECRET must be configured with at least 32 characters');
    }

    const token = jwt.sign(
        { sub: user.id },
        secret,
        { expiresIn: '1h' }
    );

    return {
        token,
        user: {
            id: user.id,
            email: user.email
        }
    };
}

export async function getUserById(userId) {
    const result = await pool.query(
        `SELECT id, email, created_at
         FROM users
         WHERE id = $1`,
        [userId]
    );

    return result.rows[0] || null;
}
