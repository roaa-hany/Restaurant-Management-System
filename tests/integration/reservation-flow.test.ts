/**
 * Integration tests for the complete reservation workflow
 */

import request from 'supertest';
import { app, resetDataStores, getDataStores } from '../../src/server';
import { sampleTables } from '../../src/data/sampleData';

describe('Reservation Flow Integration Tests', () => {
  beforeEach(() => {
    resetDataStores();
  });

  it('should complete full reservation workflow', async () => {
    const { tables } = getDataStores();
    const availableTable = tables.find(t => t.status === 'available');
    expect(availableTable).toBeDefined();

    if (!availableTable) return;

    // Step 1: Check available tables
    const availableTablesResponse = await request(app)
      .get('/api/tables/available')
      .expect(200);

    expect(availableTablesResponse.body.length).toBeGreaterThan(0);
    const tableNumbers = availableTablesResponse.body.map((t: any) => t.number);
    expect(tableNumbers).toContain(availableTable.number);

    // Step 2: Create reservation
    const reservationData = {
      customerName: 'Integration Test Customer',
      customerEmail: 'integration@test.com',
      customerPhone: '1234567890',
      tableNumber: availableTable.number,
      reservationDate: '2024-12-31',
      reservationTime: '19:00',
      numberOfGuests: 4
    };

    const createReservationResponse = await request(app)
      .post('/api/reservations')
      .send(reservationData)
      .expect(201);

    const reservationId = createReservationResponse.body.id;
    expect(createReservationResponse.body.status).toBe('confirmed');
    expect(createReservationResponse.body.tableNumber).toBe(availableTable.number);

    // Step 3: Verify table status changed to reserved
    const { tables: updatedTables } = getDataStores();
    const reservedTable = updatedTables.find(t => t.number === availableTable.number);
    expect(reservedTable?.status).toBe('reserved');

    // Step 4: Verify reservation can be retrieved
    const getReservationResponse = await request(app)
      .get(`/api/reservations/${reservationId}`)
      .expect(200);

    expect(getReservationResponse.body.id).toBe(reservationId);
    expect(getReservationResponse.body.customerName).toBe(reservationData.customerName);

    // Step 5: Verify table is no longer in available list
    const availableTablesAfterResponse = await request(app)
      .get('/api/tables/available')
      .expect(200);

    const tableNumbersAfter = availableTablesAfterResponse.body.map((t: any) => t.number);
    expect(tableNumbersAfter).not.toContain(availableTable.number);
  });

  it('should handle multiple reservations correctly', async () => {
    const { tables } = getDataStores();
    const table1 = tables[0];
    const table2 = tables[1];

    // Ensure both tables are available
    table1.status = 'available';
    table2.status = 'available';

    // Create first reservation
    await request(app)
      .post('/api/reservations')
      .send({
        customerName: 'Customer 1',
        customerEmail: 'customer1@test.com',
        customerPhone: '1111111111',
        tableNumber: table1.number,
        reservationDate: '2024-12-31',
        reservationTime: '18:00',
        numberOfGuests: 2
      })
      .expect(201);

    // Create second reservation
    await request(app)
      .post('/api/reservations')
      .send({
        customerName: 'Customer 2',
        customerEmail: 'customer2@test.com',
        customerPhone: '2222222222',
        tableNumber: table2.number,
        reservationDate: '2024-12-31',
        reservationTime: '19:00',
        numberOfGuests: 4
      })
      .expect(201);

    // Verify both reservations exist
    const reservationsResponse = await request(app)
      .get('/api/reservations')
      .expect(200);

    expect(reservationsResponse.body.length).toBe(2);

    // Verify both tables are reserved
    const { tables: updatedTables } = getDataStores();
    const reservedTable1 = updatedTables.find(t => t.number === table1.number);
    const reservedTable2 = updatedTables.find(t => t.number === table2.number);
    expect(reservedTable1?.status).toBe('reserved');
    expect(reservedTable2?.status).toBe('reserved');
  });
});

