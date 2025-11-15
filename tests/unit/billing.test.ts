/**
 * Unit tests for Billing API endpoints
 */

import request from 'supertest';
import { app, resetDataStores, getDataStores } from '../../src/server';
import { sampleTables, sampleMenuItems } from '../../src/data/sampleData';

describe('Billing API Endpoints', () => {
  beforeEach(() => {
    resetDataStores();
  });

  describe('POST /api/bills/generate', () => {
    it('should generate a bill for an order', async () => {
      // First create an order
      const table = sampleTables[0];
      const menuItem = sampleMenuItems[0];
      const createOrderResponse = await request(app)
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

      const orderId = createOrderResponse.body.id;

      const response = await request(app)
        .post('/api/bills/generate')
        .send({ orderId })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('orderId', orderId);
      expect(response.body).toHaveProperty('tableNumber', table.number);
      expect(response.body).toHaveProperty('items');
      expect(response.body).toHaveProperty('subtotal');
      expect(response.body).toHaveProperty('tax');
      expect(response.body).toHaveProperty('total');
      expect(response.body).toHaveProperty('paymentMethod');
      expect(response.body).toHaveProperty('paymentStatus', 'pending');
      expect(response.body).toHaveProperty('createdAt');
    });

    it('should calculate bill totals correctly', async () => {
      // Create an order with known prices
      const table = sampleTables[0];
      const menuItem = sampleMenuItems[0];
      const quantity = 2;
      const itemPrice = menuItem.price;

      const createOrderResponse = await request(app)
        .post('/api/orders')
        .send({
          tableNumber: table.number,
          items: [
            {
              menuItemId: menuItem.id,
              quantity: quantity,
              price: itemPrice
            }
          ],
          assignedWaiter: 'waiter_1'
        })
        .expect(201);

      const orderId = createOrderResponse.body.id;

      const response = await request(app)
        .post('/api/bills/generate')
        .send({ orderId })
        .expect(201);

      const expectedSubtotal = itemPrice * quantity;
      const expectedTax = expectedSubtotal * 0.1; // 10% tax
      const expectedTotal = expectedSubtotal + expectedTax;

      expect(response.body.subtotal).toBeCloseTo(expectedSubtotal, 2);
      expect(response.body.tax).toBeCloseTo(expectedTax, 2);
      expect(response.body.total).toBeCloseTo(expectedTotal, 2);
    });

    it('should use default payment method if not provided', async () => {
      const table = sampleTables[0];
      const menuItem = sampleMenuItems[0];
      const createOrderResponse = await request(app)
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

      const orderId = createOrderResponse.body.id;

      const response = await request(app)
        .post('/api/bills/generate')
        .send({ orderId })
        .expect(201);

      expect(response.body.paymentMethod).toBe('cash');
    });

    it('should use provided payment method', async () => {
      const table = sampleTables[0];
      const menuItem = sampleMenuItems[0];
      const createOrderResponse = await request(app)
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

      const orderId = createOrderResponse.body.id;

      const response = await request(app)
        .post('/api/bills/generate')
        .send({ orderId, paymentMethod: 'card' })
        .expect(201);

      expect(response.body.paymentMethod).toBe('card');
    });

    it('should return 404 for non-existent order', async () => {
      const response = await request(app)
        .post('/api/bills/generate')
        .send({ orderId: 'non-existent-order-id' })
        .expect(404);

      expect(response.body).toHaveProperty('error', 'Order not found');
    });
  });

  describe('POST /api/bills/:id/pay', () => {
    it('should process payment for a bill', async () => {
      // Create order and generate bill
      const table = sampleTables[0];
      const menuItem = sampleMenuItems[0];
      const createOrderResponse = await request(app)
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

      const orderId = createOrderResponse.body.id;

      const generateBillResponse = await request(app)
        .post('/api/bills/generate')
        .send({ orderId })
        .expect(201);

      const billId = generateBillResponse.body.id;

      const response = await request(app)
        .post(`/api/bills/${billId}/pay`)
        .send({ paymentMethod: 'card', orderId })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message', 'Payment processed successfully');
      expect(response.body).toHaveProperty('billId', billId);
      expect(response.body).toHaveProperty('paymentMethod', 'card');
    });

    it('should mark order as paid and table as available after payment', async () => {
      // Create order and generate bill
      const table = sampleTables[0];
      const menuItem = sampleMenuItems[0];
      const createOrderResponse = await request(app)
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

      const orderId = createOrderResponse.body.id;

      const generateBillResponse = await request(app)
        .post('/api/bills/generate')
        .send({ orderId })
        .expect(201);

      const billId = generateBillResponse.body.id;

      await request(app)
        .post(`/api/bills/${billId}/pay`)
        .send({ paymentMethod: 'card', orderId })
        .expect(200);

      const { orders, tables } = getDataStores();
      const order = orders.find(o => o.id === orderId);
      const updatedTable = tables.find(t => t.number === table.number);

      expect(order?.status).toBe('paid');
      expect(updatedTable?.status).toBe('available');
      expect(updatedTable?.assignedWaiter).toBeUndefined();
      expect(updatedTable?.currentOrder).toBeUndefined();
    });
  });
});

