import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '../app';

describe('Health Routes', () => {
  describe('GET /api/v1/health', () => {
    it('should return 200 with health status', async () => {
      const response = await request(app).get('/api/v1/health');

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        success: true,
        data: {
          status: 'healthy',
          environment: expect.any(String),
        },
      });
      expect(response.body.data).toHaveProperty('timestamp');
      expect(response.body.data).toHaveProperty('uptime');
    });
  });

  describe('GET /api/v1/health/detailed', () => {
    it('should return detailed health status with service checks', async () => {
      const response = await request(app).get('/api/v1/health/detailed');

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        success: true,
        data: {
          status: 'healthy',
          environment: expect.any(String),
          services: {
            database: 'connected',
            redis: 'connected',
          },
        },
      });
    });

    it('should include timestamp and uptime', async () => {
      const response = await request(app).get('/api/v1/health/detailed');

      expect(response.body.data).toHaveProperty('timestamp');
      expect(response.body.data).toHaveProperty('uptime');
      expect(typeof response.body.data.uptime).toBe('number');
    });
  });

  describe('GET /health (root endpoint)', () => {
    it('should return 200 with basic health status', async () => {
      const response = await request(app).get('/health');

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        status: 'healthy',
        environment: expect.any(String),
      });
    });
  });
});

describe('API Routes', () => {
  describe('GET /api/v1', () => {
    it('should return API information', async () => {
      const response = await request(app).get('/api/v1');

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        success: true,
        data: {
          message: 'SongMatch API v1',
          version: '1.0.0',
          endpoints: expect.any(Object),
        },
      });
    });
  });

  describe('GET /api/v1/nonexistent', () => {
    it('should return 404 for non-existent routes', async () => {
      const response = await request(app).get('/api/v1/nonexistent');

      expect(response.status).toBe(404);
      expect(response.body).toMatchObject({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: expect.stringContaining('not found'),
        },
      });
    });
  });
});
