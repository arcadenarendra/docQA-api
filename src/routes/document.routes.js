import express from 'express';

import { uploadPdf } from '../middleware/upload.middleware.js';
import { authenticateToken } from '../middleware/auth.middleware.js';
import { uploadDocument } from '../controllers/document.controller.js';

const router = express.Router();

router.post(
    '/upload',
    authenticateToken,
    uploadPdf,
    uploadDocument
);

export default router;