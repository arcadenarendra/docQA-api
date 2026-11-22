
import { describe, it, expect } from 'vitest';
import request from 'supertest';

import app from '../src/app.js';

describe('API Health Check', () => {
    it('should return 200 when the API is healthy.', async () => {
        const response = await request(app).get('/health');

        expect(response.status).toBe(200);
        expect(response.body.status).toBe('ok');
    });

    it('should return 404 for an unknown route', async () => {
        const response = await request(app).get('/invalid');

        expect(response.status).toBe(404);
        expect(response.body.error.message).toBe('Route not found');
    });
});
