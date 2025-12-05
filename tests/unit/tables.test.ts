/**
 * Unit tests for Tables API endpoints
 */

import request from 'supertest';
import { app, resetDataStores, getDataStores } from '../../src/server';
import { sampleTables } from '../../src/data/sampleData';

describe('Tables API Endpoints', () => {
  beforeEach(() => {
    resetDataStores();
  });

  describe('GET /api/tables', () => {
    it('should return all tables', async () => {
      const response = await request(app)
        .get('/api/tables')
        .expect(200);

      expect(response.body).toBeInstanceOf(Array);
      expect(response.body.length).toBe(sampleTables.length);
      expect(response.body[0]).toHaveProperty('id');
      expect(response.body[0]).toHaveProperty('number');
      expect(response.body[0]).toHaveProperty('capacity');
      expect(response.body[0]).toHaveProperty('status');
    });

    it('should return tables with correct structure', async () => {
      const response = await request(app)
        .get('/api/tables')
        .expect(200);

      const table = response.body[0];
      expect(table).toHaveProperty('id');
      expect(table).toHaveProperty('number');
      expect(table).toHaveProperty('capacity');
      expect(table).toHaveProperty('status');
      expect(['available', 'occupied', 'reserved', 'need-assistance']).toContain(table.status);
    });
  });

  describe('GET /api/tables/available', () => {
    it('should return only available tables', async () => {
      const response = await request(app)
        .get('/api/tables/available')
        .expect(200);

      expect(response.body).toBeInstanceOf(Array);
      response.body.forEach((table: any) => {
        expect(table.status).toBe('available');
      });
    });

    it('should return empty array when no tables are available', async () => {
      // Mark all tables as occupied
      const { tables } = getDataStores();
      tables.forEach(table => {
        table.status = 'occupied';
      });

      const response = await request(app)
        .get('/api/tables/available')
        .expect(200);

      expect(response.body).toBeInstanceOf(Array);
      expect(response.body.length).toBe(0);
    });
  });

  describe('PUT /api/tables/:id/status', () => {
    it('should update table status', async () => {
      const tableId = sampleTables[0].id;
      const newStatus = 'occupied';

      const response = await request(app)
        .put(`/api/tables/${tableId}/status`)
        .send({ status: newStatus })
        .expect(200);

      expect(response.body).toHaveProperty('id', tableId);
      expect(response.body).toHaveProperty('status', newStatus);
    });

    it('should update assigned waiter', async () => {
      const tableId = sampleTables[0].id;
      const waiterId = 'waiter_1';

      const response = await request(app)
        .put(`/api/tables/${tableId}/status`)
        .send({ assignedWaiter: waiterId })
        .expect(200);

      expect(response.body).toHaveProperty('assignedWaiter', waiterId);
    });

    it('should update both status and assigned waiter', async () => {
      const tableId = sampleTables[0].id;
      const newStatus = 'occupied';
      const waiterId = 'waiter_1';

      const response = await request(app)
        .put(`/api/tables/${tableId}/status`)
        .send({ status: newStatus, assignedWaiter: waiterId })
        .expect(200);

      expect(response.body).toHaveProperty('status', newStatus);
      expect(response.body).toHaveProperty('assignedWaiter', waiterId);
    });

    it('should return 404 for non-existent table', async () => {
      const response = await request(app)
        .put('/api/tables/non-existent-id/status')
        .send({ status: 'occupied' })
        .expect(404);

      expect(response.body).toHaveProperty('error', 'Table not found');
    });
  });

  describe('POST /api/tables/:id/assign', () => {
    it('should assign table to waiter', async () => {
      const tableId = sampleTables[0].id;
      const waiterId = 'waiter_1';

      const response = await request(app)
        .post(`/api/tables/${tableId}/assign`)
        .send({ waiterId })
        .expect(200);

      expect(response.body).toHaveProperty('id', tableId);
      expect(response.body).toHaveProperty('assignedWaiter', waiterId);
      expect(response.body).toHaveProperty('status', 'occupied');
    });

    it('should return 404 for non-existent table', async () => {
      const response = await request(app)
        .post('/api/tables/non-existent-id/assign')
        .send({ waiterId: 'waiter_1' })
        .expect(404);

      expect(response.body).toHaveProperty('error', 'Table not found');
    });
  });

  describe('POST /api/tables/:id/assist', () => {
    it('should mark table as needing assistance', async () => {
      const tableId = sampleTables[0].id;

      const response = await request(app)
        .post(`/api/tables/${tableId}/assist`)
        .expect(200);

      expect(response.body).toHaveProperty('id', tableId);
      expect(response.body).toHaveProperty('status', 'need-assistance');
    });

    it('should return 404 for non-existent table', async () => {
      const response = await request(app)
        .post('/api/tables/non-existent-id/assist')
        .expect(404);

      expect(response.body).toHaveProperty('error', 'Table not found');
    });
  });
});

