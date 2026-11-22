
import express from 'express';
import { pool } from '../db/pool.js';

const router = express.Router();

// Basic API health check
router.get('/', (req, res) => {
    res.status(200).json({
        status: 'ok',
        message: 'Document Q&A API is running'
    });
});

// Database health check
router.get('/db', async (req, res) => {
    try {
        await pool.query('SELECT 1');

        res.status(200).json({
            status: 'ok',
            database: 'connected'
        });
    } catch (error) {
        console.error('Database health check failed:', error.message);

        res.status(503).json({
            status: 'error',
            database: 'unavailable'
        });
    }
});

export default router;
