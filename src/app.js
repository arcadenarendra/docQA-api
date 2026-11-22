
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';

import healthRoutes from './routes/health.routes.js';
import authRoutes from './routes/auth.routes.js';
import errorHandler from './middleware/error.middleware.js';

const app = express();

// Security and middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '1mb' }));

// API routes
app.use('/health', healthRoutes);
app.use('/api/v1/auth', authRoutes);

// 404 handler
app.use((req, res, next) => {
    const error = new Error('Route not found');
    error.statusCode = 404;
    next(error);
});

// Global error handler (must be last)
app.use(errorHandler);

export default app;
