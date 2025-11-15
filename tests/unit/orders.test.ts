/**
 * Unit tests for Orders API endpoints
 */

import request from 'supertest';
import { app, resetDataStores, getDataStores } from '../../src/server';
import { sampleTables, sampleMenuItems } from '../../src/data/sampleData';

describe('Orders API Endpoints', () => {
  beforeEach(() => {
    resetDataStores();
  });

  describe('GET /api/orders', () => {
    it('should return all orders', async () => {
      const response = await request(app)
        .get('/api/orders')
        .expect(200);

      expect(response.body).toBeInstanceOf(Array);
    });

    it('should return orders with correct structure', async () => {
      // First create an order
      const table = sampleTables[0];
      const menuItem = sampleMenuItems[0];
      
      await request(app)
        .post('/api/orders')
        .send({
          tableNumber: table.number,
          items: [
            {
              menuItemId: menuItem.id,
              quantity: 2,
              price: menuItem.price
            }
          ],
          assignedWaiter: 'waiter_1',
          customerName: 'Test Customer'
        });

      const response = await request(app)
        .get('/api/orders')
        .expect(200);

      expect(response.body.length).toBeGreaterThan(0);
      const order = response.body[0];
      expect(order).toHaveProperty('id');
      expect(order).toHaveProperty('tableNumber');
      expect(order).toHaveProperty('items');
      expect(order).toHaveProperty('status');
      expect(order).toHaveProperty('createdAt');
      expect(Array.isArray(order.items)).toBe(true);
    });
  });

  describe('POST /api/orders', () => {
    it('should create a new order', async () => {
      const table = sampleTables[0];
      const menuItem = sampleMenuItems[0];
      const orderData = {
        tableNumber: table.number,
        items: [
          {
            menuItemId: menuItem.id,
            quantity: 2,
            price: menuItem.price
          }
        ],
        assignedWaiter: 'waiter_1',
        customerName: 'John Doe'
      };

      const response = await request(app)
        .post('/api/orders')
        .send(orderData)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('tableNumber', orderData.tableNumber);
      expect(response.body).toHaveProperty('items');
      expect(response.body).toHaveProperty('status', 'pending');
      expect(response.body).toHaveProperty('assignedWaiter', orderData.assignedWaiter);
      expect(response.body.items.length).toBe(1);
    });

    it('should update table status to occupied when order is created', async () => {
      const table = sampleTables[0];
      const menuItem = sampleMenuItems[0];
      const orderData = {
        tableNumber: table.number,
        items: [
          {
            menuItemId: menuItem.id,
            quantity: 2,
            price: menuItem.price
          }
        ],
        assignedWaiter: 'waiter_1'
      };

      await request(app)
        .post('/api/orders')
        .send(orderData)
        .expect(201);

      const { tables } = getDataStores();
      const updatedTable = tables.find(t => t.number === table.number);
      expect(updatedTable?.status).toBe('occupied');
      expect(updatedTable?.assignedWaiter).toBe('waiter_1');
      expect(updatedTable?.currentOrder).toBeDefined();
    });

    it('should return 400 if table does not exist', async () => {
      const menuItem = sampleMenuItems[0];
      const orderData = {
        tableNumber: 999, // Non-existent table
        items: [
          {
            menuItemId: menuItem.id,
            quantity: 2,
            price: menuItem.price
          }
        ]
      };

      const response = await request(app)
        .post('/api/orders')
        .send(orderData)
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Table not found');
    });

    it('should return 400 if required fields are missing', async () => {
      const table = sampleTables[0];
      const incompleteData = {
        tableNumber: table.number
        // Missing items
      };

      const response = await request(app)
        .post('/api/orders')
        .send(incompleteData)
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Missing required fields');
    });

    it('should return 400 if items array is empty', async () => {
      const table = sampleTables[0];
      const orderData = {
        tableNumber: table.number,
        items: []
      };

      const response = await request(app)
        .post('/api/orders')
        .send(orderData)
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Missing required fields');
    });
  });

  describe('GET /api/orders/:id', () => {
    it('should return a specific order by ID', async () => {
      // First create an order
      const table = sampleTables[0];
      const menuItem = sampleMenuItems[0];
      const createResponse = await request(app)
        .post('/api/orders')
        .send({
          tableNumber: table.number,
          items: [
            {
              menuItemId: menuItem.id,
              quantity: 2,
              price: menuItem.price
            }
          ],
          assignedWaiter: 'waiter_1'
        })
        .expect(201);

      const orderId = createResponse.body.id;

      const response = await request(app)
        .get(`/api/orders/${orderId}`)
        .expect(200);

      expect(response.body).toHaveProperty('id', orderId);
      expect(response.body).toHaveProperty('tableNumber', table.number);
    });

    it('should return 404 for non-existent order', async () => {
      const response = await request(app)
        .get('/api/orders/non-existent-id')
        .expect(404);

      expect(response.body).toHaveProperty('error', 'Order not found');
    });
  });

  describe('PUT /api/orders/:id/status', () => {
    it('should update order status', async () => {
      // First create an order
      const table = sampleTables[0];
      const menuItem = sampleMenuItems[0];
      const createResponse = await request(app)
        .post('/api/orders')
        .send({
          tableNumber: table.number,
          items: [
            {
              menuItemId: menuItem.id,
              quantity: 2,
              price: menuItem.price
            }
          ],
          assignedWaiter: 'waiter_1'
        })
        .expect(201);

      const orderId = createResponse.body.id;

      const response = await request(app)
        .put(`/api/orders/${orderId}/status`)
        .send({ status: 'preparing' })
        .expect(200);

      expect(response.body).toHaveProperty('id', orderId);
      expect(response.body).toHaveProperty('status', 'preparing');
    });

    it('should mark table as available when order status is paid', async () => {
      // First create an order
      const table = sampleTables[0];
      const menuItem = sampleMenuItems[0];
      const createResponse = await request(app)
        .post('/api/orders')
        .send({
          tableNumber: table.number,
          items: [
            {
              menuItemId: menuItem.id,
              quantity: 2,
              price: menuItem.price
            }
          ],
          assignedWaiter: 'waiter_1'
        })
        .expect(201);

      const orderId = createResponse.body.id;

      await request(app)
        .put(`/api/orders/${orderId}/status`)
        .send({ status: 'paid' })
        .expect(200);

      const { tables } = getDataStores();
      const updatedTable = tables.find(t => t.number === table.number);
      expect(updatedTable?.status).toBe('available');
      expect(updatedTable?.assignedWaiter).toBeUndefined();
      expect(updatedTable?.currentOrder).toBeUndefined();
    });

    it('should return 404 for non-existent order', async () => {
      const response = await request(app)
        .put('/api/orders/non-existent-id/status')
        .send({ status: 'preparing' })
        .expect(404);

      expect(response.body).toHaveProperty('error', 'Order not found');
    });
  });
});

