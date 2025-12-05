/**
 * Unit tests for Authentication API endpoints
 */

import request from 'supertest';
import { app, resetDataStores } from '../../src/server';

describe('Authentication API Endpoints', () => {
  beforeEach(() => {
    resetDataStores();
  });

  describe('POST /api/auth/login', () => {
    it('should login waiter with correct credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'waiter',
          password: 'waiter123',
          role: 'waiter'
        })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('username', 'waiter');
      expect(response.body).toHaveProperty('role', 'waiter');
      expect(response.body).toHaveProperty('name', 'Ahmed Waiter');
      expect(response.body).toHaveProperty('id', 'waiter');
      expect(response.body).toHaveProperty('token');
      expect(typeof response.body.token).toBe('string');
    });

    it('should login manager with correct credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'manager',
          password: 'manager123',
          role: 'manager'
        })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('username', 'manager');
      expect(response.body).toHaveProperty('role', 'manager');
      expect(response.body).toHaveProperty('name', 'Manager');
      expect(response.body).toHaveProperty('id', 'manager');
      expect(response.body).toHaveProperty('token');
    });

    it('should return 400 if required fields are missing', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'waiter'
          // Missing password and role
        })
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Missing required fields');
    });

    it('should return 401 for incorrect password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'waiter',
          password: 'wrongpassword',
          role: 'waiter'
        })
        .expect(401);

      expect(response.body).toHaveProperty('error', 'Invalid credentials');
    });

    it('should return 401 for incorrect username', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'nonexistent',
          password: 'waiter123',
          role: 'waiter'
        })
        .expect(401);

      expect(response.body).toHaveProperty('error', 'Invalid credentials');
    });

    it('should return 401 for incorrect role', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'waiter',
          password: 'waiter123',
          role: 'manager' // Wrong role
        })
        .expect(401);

      expect(response.body).toHaveProperty('error', 'Invalid credentials');
    });

    it('should return 401 when waiter tries to login as manager', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'waiter',
          password: 'waiter123',
          role: 'manager'
        })
        .expect(401);

      expect(response.body).toHaveProperty('error', 'Invalid credentials');
    });

    it('should return 401 when manager tries to login as waiter', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'manager',
          password: 'manager123',
          role: 'waiter'
        })
        .expect(401);

      expect(response.body).toHaveProperty('error', 'Invalid credentials');
    });
  });
});

