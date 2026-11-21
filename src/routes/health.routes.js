
import express from 'express';

const router = express.Router();

router.get('/', (req, res) => {
    res.status(200).json({
        status: 'ok',
        message: 'Document Q&A API is running'
    });
});

export default router;
