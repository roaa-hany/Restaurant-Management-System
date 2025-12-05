/**
 * Integration tests for the complete order-to-payment workflow
 */

import request from 'supertest';
import { app, resetDataStores, getDataStores } from '../../src/server';
import { sampleTables, sampleMenuItems } from '../../src/data/sampleData';

describe('Order to Payment Flow Integration Tests', () => {
  beforeEach(() => {
    resetDataStores();
  });

  it('should complete full order-to-payment workflow', async () => {
    const table = sampleTables[0];
    const menuItem1 = sampleMenuItems[0];
    const menuItem2 = sampleMenuItems[1] || sampleMenuItems[0];
    const waiterId = 'waiter_1';

    // Step 1: Verify table is available
    const availableTablesResponse = await request(app)
      .get('/api/tables/available')
      .expect(200);

    const tableNumbers = availableTablesResponse.body.map((t: any) => t.number);
    expect(tableNumbers).toContain(table.number);

    // Step 2: Create an order
    const orderData = {
      tableNumber: table.number,
      items: [
        {
          menuItemId: menuItem1.id,
          quantity: 2,
          price: menuItem1.price
        },
        {
          menuItemId: menuItem2.id,
          quantity: 1,
          price: menuItem2.price
        }
      ],
      assignedWaiter: waiterId,
      customerName: 'Test Customer'
    };

    const createOrderResponse = await request(app)
      .post('/api/orders')
      .send(orderData)
      .expect(201);

    const orderId = createOrderResponse.body.id;
    expect(createOrderResponse.body.status).toBe('pending');
    expect(createOrderResponse.body.tableNumber).toBe(table.number);

    // Step 3: Verify table status changed to occupied
    const { tables: updatedTables } = getDataStores();
    const occupiedTable = updatedTables.find(t => t.number === table.number);
    expect(occupiedTable?.status).toBe('occupied');
    expect(occupiedTable?.assignedWaiter).toBe(waiterId);
    expect(occupiedTable?.currentOrder).toBe(orderId);

    // Step 4: Verify order can be retrieved
    const getOrderResponse = await request(app)
      .get(`/api/orders/${orderId}`)
      .expect(200);

    expect(getOrderResponse.body.id).toBe(orderId);
    expect(getOrderResponse.body.items.length).toBe(2);

    // Step 5: Update order status to preparing
    await request(app)
      .put(`/api/orders/${orderId}/status`)
      .send({ status: 'preparing' })
      .expect(200);

    // Step 6: Update order status to ready
    await request(app)
      .put(`/api/orders/${orderId}/status`)
      .send({ status: 'ready' })
      .expect(200);

    // Step 7: Generate bill
    const generateBillResponse = await request(app)
      .post('/api/bills/generate')
      .send({ orderId, paymentMethod: 'card' })
      .expect(201);

    const billId = generateBillResponse.body.id;
    expect(generateBillResponse.body.orderId).toBe(orderId);
    expect(generateBillResponse.body.tableNumber).toBe(table.number);
    expect(generateBillResponse.body.paymentMethod).toBe('card');
    expect(generateBillResponse.body.paymentStatus).toBe('pending');

    // Verify bill calculations
    const expectedSubtotal = (menuItem1.price * 2) + (menuItem2.price * 1);
    const expectedTax = expectedSubtotal * 0.1;
    const expectedTotal = expectedSubtotal + expectedTax;

    expect(generateBillResponse.body.subtotal).toBeCloseTo(expectedSubtotal, 2);
    expect(generateBillResponse.body.tax).toBeCloseTo(expectedTax, 2);
    expect(generateBillResponse.body.total).toBeCloseTo(expectedTotal, 2);

    // Step 8: Process payment
    const paymentResponse = await request(app)
      .post(`/api/bills/${billId}/pay`)
      .send({ paymentMethod: 'card', orderId })
      .expect(200);

    expect(paymentResponse.body.success).toBe(true);
    expect(paymentResponse.body.paymentMethod).toBe('card');

    // Step 9: Verify order status is paid
    const { orders } = getDataStores();
    const paidOrder = orders.find(o => o.id === orderId);
    expect(paidOrder?.status).toBe('paid');

    // Step 10: Verify table is available again
    const { tables: finalTables } = getDataStores();
    const availableTable = finalTables.find(t => t.number === table.number);
    expect(availableTable?.status).toBe('available');
    expect(availableTable?.assignedWaiter).toBeUndefined();
    expect(availableTable?.currentOrder).toBeUndefined();

    // Step 11: Verify table is back in available list
    const availableTablesAfterResponse = await request(app)
      .get('/api/tables/available')
      .expect(200);

    const tableNumbersAfter = availableTablesAfterResponse.body.map((t: any) => t.number);
    expect(tableNumbersAfter).toContain(table.number);
  });

  it('should handle order status transitions correctly', async () => {
    const table = sampleTables[0];
    const menuItem = sampleMenuItems[0];
    const waiterId = 'waiter_1';

    // Create order
    const createOrderResponse = await request(app)
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

    const orderId = createOrderResponse.body.id;

    // Test status transitions
    const statuses = ['pending', 'preparing', 'ready', 'served', 'completed'];
    
    for (const status of statuses) {
      const response = await request(app)
        .put(`/api/orders/${orderId}/status`)
        .send({ status })
        .expect(200);

      expect(response.body.status).toBe(status);
    }
  });

  it('should handle multiple orders for different tables', async () => {
    const table1 = sampleTables[0];
    const table2 = sampleTables[1];
    const menuItem = sampleMenuItems[0];
    const waiterId = 'waiter_1';

    // Create order for table 1
    const order1Response = await request(app)
      .post('/api/orders')
      .send({
        tableNumber: table1.number,
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

    // Create order for table 2
    const order2Response = await request(app)
      .post('/api/orders')
      .send({
        tableNumber: table2.number,
        items: [
          {
            menuItemId: menuItem.id,
            quantity: 2,
            price: menuItem.price
          }
        ],
        assignedWaiter: waiterId
      })
      .expect(201);

    // Verify both orders exist
    const ordersResponse = await request(app)
      .get('/api/orders')
      .expect(200);

    expect(ordersResponse.body.length).toBe(2);

    // Verify both tables are occupied
    const { tables: updatedTables } = getDataStores();
    const occupiedTable1 = updatedTables.find(t => t.number === table1.number);
    const occupiedTable2 = updatedTables.find(t => t.number === table2.number);
    expect(occupiedTable1?.status).toBe('occupied');
    expect(occupiedTable2?.status).toBe('occupied');

    // Process payment for order 1
    const bill1Response = await request(app)
      .post('/api/bills/generate')
      .send({ orderId: order1Response.body.id })
      .expect(201);

    await request(app)
      .post(`/api/bills/${bill1Response.body.id}/pay`)
      .send({ paymentMethod: 'cash', orderId: order1Response.body.id })
      .expect(200);

    // Verify table 1 is available, table 2 is still occupied
    const { tables: finalTables } = getDataStores();
    const finalTable1 = finalTables.find(t => t.number === table1.number);
    const finalTable2 = finalTables.find(t => t.number === table2.number);
    expect(finalTable1?.status).toBe('available');
    expect(finalTable2?.status).toBe('occupied');
  });
});

