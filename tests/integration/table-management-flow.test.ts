/**
 * Integration tests for table management workflow
 */

import request from 'supertest';
import { app, resetDataStores, getDataStores } from '../../src/server';
import { sampleTables, sampleMenuItems } from '../../src/data/sampleData';

describe('Table Management Flow Integration Tests', () => {
  beforeEach(() => {
    resetDataStores();
  });

  it('should handle complete table lifecycle', async () => {
    const table = sampleTables[0];
    const waiterId = 'waiter_1';

    // Step 1: Table starts as available
    const availableTablesResponse = await request(app)
      .get('/api/tables/available')
      .expect(200);

    const tableNumbers = availableTablesResponse.body.map((t: any) => t.number);
    expect(tableNumbers).toContain(table.number);

    // Step 2: Assign table to waiter
    const assignResponse = await request(app)
      .post(`/api/tables/${table.id}/assign`)
      .send({ waiterId })
      .expect(200);

    expect(assignResponse.body.status).toBe('occupied');
    expect(assignResponse.body.assignedWaiter).toBe(waiterId);

    // Step 3: Verify table is no longer available
    const availableTablesAfterAssign = await request(app)
      .get('/api/tables/available')
      .expect(200);

    const tableNumbersAfter = availableTablesAfterAssign.body.map((t: any) => t.number);
    expect(tableNumbersAfter).not.toContain(table.number);

    // Step 4: Mark table as needing assistance
    const assistResponse = await request(app)
      .post(`/api/tables/${table.id}/assist`)
      .expect(200);

    expect(assistResponse.body.status).toBe('need-assistance');

    // Step 5: Update table status back to occupied
    await request(app)
      .put(`/api/tables/${table.id}/status`)
      .send({ status: 'occupied' })
      .expect(200);

    // Step 6: Create order for table
    const menuItem = sampleMenuItems[0];
    const orderResponse = await request(app)
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

    // Step 7: Process payment to free table
    const billResponse = await request(app)
      .post('/api/bills/generate')
      .send({ orderId: orderResponse.body.id })
      .expect(201);

    await request(app)
      .post(`/api/bills/${billResponse.body.id}/pay`)
      .send({ paymentMethod: 'cash', orderId: orderResponse.body.id })
      .expect(200);

    // Step 8: Verify table is available again
    const availableTablesFinal = await request(app)
      .get('/api/tables/available')
      .expect(200);

    const tableNumbersFinal = availableTablesFinal.body.map((t: any) => t.number);
    expect(tableNumbersFinal).toContain(table.number);

    const { tables: finalTables } = getDataStores();
    const finalTable = finalTables.find(t => t.number === table.number);
    expect(finalTable?.status).toBe('available');
    expect(finalTable?.assignedWaiter).toBeUndefined();
  });

  it('should handle waiter assignment and reassignment', async () => {
    const table = sampleTables[0];
    const waiter1 = 'waiter_1';
    const waiter2 = 'waiter_2';

    // Assign to waiter 1
    await request(app)
      .post(`/api/tables/${table.id}/assign`)
      .send({ waiterId: waiter1 })
      .expect(200);

    // Verify assignment
    const { tables: tables1 } = getDataStores();
    const table1 = tables1.find(t => t.id === table.id);
    expect(table1?.assignedWaiter).toBe(waiter1);

    // Reassign to waiter 2
    await request(app)
      .put(`/api/tables/${table.id}/status`)
      .send({ assignedWaiter: waiter2 })
      .expect(200);

    // Verify reassignment
    const { tables: tables2 } = getDataStores();
    const table2 = tables2.find(t => t.id === table.id);
    expect(table2?.assignedWaiter).toBe(waiter2);
  });

  it('should track table status through order lifecycle', async () => {
    const table = sampleTables[0];
    const menuItem = sampleMenuItems[0];
    const waiterId = 'waiter_1';

    // Ensure table is available at start
    let { tables: currentTables } = getDataStores();
    let currentTable = currentTables.find(t => t.number === table.number);
    if (currentTable) {
      currentTable.status = 'available';
      currentTable.assignedWaiter = undefined;
      currentTable.currentOrder = undefined;
    }
    
    // Verify initial state: available
    currentTables = getDataStores().tables;
    currentTable = currentTables.find(t => t.number === table.number);
    expect(currentTable?.status).toBe('available');

    // Create order: should become occupied
    const orderResponse = await request(app)
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

    currentTables = getDataStores().tables;
    currentTable = currentTables.find(t => t.number === table.number);
    expect(currentTable?.status).toBe('occupied');
    expect(currentTable?.currentOrder).toBe(orderResponse.body.id);

    // Mark as needing assistance
    await request(app)
      .post(`/api/tables/${table.id}/assist`)
      .expect(200);

    currentTables = getDataStores().tables;
    currentTable = currentTables.find(t => t.number === table.number);
    expect(currentTable?.status).toBe('need-assistance');

    // Process payment: should become available
    const billResponse = await request(app)
      .post('/api/bills/generate')
      .send({ orderId: orderResponse.body.id })
      .expect(201);

    await request(app)
      .post(`/api/bills/${billResponse.body.id}/pay`)
      .send({ paymentMethod: 'cash', orderId: orderResponse.body.id })
      .expect(200);

    currentTables = getDataStores().tables;
    currentTable = currentTables.find(t => t.number === table.number);
    expect(currentTable?.status).toBe('available');
    expect(currentTable?.assignedWaiter).toBeUndefined();
    expect(currentTable?.currentOrder).toBeUndefined();
  });
});

