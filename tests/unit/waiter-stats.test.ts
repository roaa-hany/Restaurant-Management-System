/**
 * Unit tests for Waiter Stats API endpoints
 */

import request from 'supertest';
import { app, resetDataStores } from '../../src/server';
import { sampleTables, sampleMenuItems } from '../../src/data/sampleData';

describe('Waiter Stats API Endpoints', () => {
  beforeEach(() => {
    resetDataStores();
  });

  describe('GET /api/waiters/:id/stats', () => {
    it('should return waiter statistics', async () => {
      const waiterId = 'waiter_1';

      const response = await request(app)
        .get(`/api/waiters/${waiterId}/stats`)
        .expect(200);

      expect(response.body).toHaveProperty('activeTables');
      expect(response.body).toHaveProperty('pendingOrders');
      expect(response.body).toHaveProperty('todayRevenue');
      expect(response.body).toHaveProperty('avgServiceTime');
      expect(response.body).toHaveProperty('totalTablesServed');
      expect(response.body).toHaveProperty('totalRevenue');
      expect(response.body).toHaveProperty('customerRating');
      expect(response.body).toHaveProperty('orderAccuracy');

      expect(typeof response.body.activeTables).toBe('number');
      expect(typeof response.body.pendingOrders).toBe('number');
      expect(typeof response.body.todayRevenue).toBe('number');
    });

    it('should return correct active tables count', async () => {
      const waiterId = 'waiter_1';
      const table = sampleTables[0];
      const menuItem = sampleMenuItems[0];

      // Create an order assigned to the waiter
      await request(app)
        .post('/api/orders')
        .send({
          tableNumber: table.number,
          items: [
            {
              menuItemId: menuItem.id,
              quantity: 1,
              price: menuItem.price
            }
          ],
          assignedWaiter: waiterId
        })
        .expect(201);

      const response = await request(app)
        .get(`/api/waiters/${waiterId}/stats`)
        .expect(200);

      expect(response.body.activeTables).toBeGreaterThanOrEqual(1);
    });

    it('should return correct pending orders count', async () => {
      const waiterId = 'waiter_1';
      const table = sampleTables[0];
      const menuItem = sampleMenuItems[0];

      // Create a pending order
      await request(app)
        .post('/api/orders')
        .send({
          tableNumber: table.number,
          items: [
            {
              menuItemId: menuItem.id,
              quantity: 1,
              price: menuItem.price
            }
          ],
          assignedWaiter: waiterId
        })
        .expect(201);

      const response = await request(app)
        .get(`/api/waiters/${waiterId}/stats`)
        .expect(200);

      expect(response.body.pendingOrders).toBeGreaterThanOrEqual(1);
    });

    it('should return zero stats for waiter with no orders', async () => {
      const waiterId = 'waiter_with_no_orders';

      const response = await request(app)
        .get(`/api/waiters/${waiterId}/stats`)
        .expect(200);

      expect(response.body.activeTables).toBe(0);
      expect(response.body.pendingOrders).toBe(0);
      expect(response.body.todayRevenue).toBe(0);
      expect(response.body.totalTablesServed).toBe(0);
    });
  });
});

