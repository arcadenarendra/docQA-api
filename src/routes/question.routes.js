import express from 'express';

import {
    authenticateToken
} from '../middleware/auth.middleware.js';

import {
    askQuestion
} from '../controllers/question.controller.js';

const router = express.Router();

router.post('/ask', authenticateToken, askQuestion);

export default router;