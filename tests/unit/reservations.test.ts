/**
 * Unit tests for Reservations API endpoints
 */

import request from 'supertest';
import { app, resetDataStores, getDataStores } from '../../src/server';
import { sampleTables } from '../../src/data/sampleData';

describe('Reservations API Endpoints', () => {
  beforeEach(() => {
    resetDataStores();
  });

  describe('GET /api/reservations', () => {
    it('should return all reservations', async () => {
      const response = await request(app)
        .get('/api/reservations')
        .expect(200);

      expect(response.body).toBeInstanceOf(Array);
    });

    it('should return reservations with correct structure', async () => {
      // First create a reservation
      const table = sampleTables[0];
      await request(app)
        .post('/api/reservations')
        .send({
          customerName: 'Test Customer',
          customerEmail: 'test@example.com',
          customerPhone: '1234567890',
          tableNumber: table.number,
          reservationDate: '2024-12-31',
          reservationTime: '19:00',
          numberOfGuests: 2
        });

      const response = await request(app)
        .get('/api/reservations')
        .expect(200);

      expect(response.body.length).toBeGreaterThan(0);
      const reservation = response.body[0];
      expect(reservation).toHaveProperty('id');
      expect(reservation).toHaveProperty('customerName');
      expect(reservation).toHaveProperty('customerEmail');
      expect(reservation).toHaveProperty('tableNumber');
      expect(reservation).toHaveProperty('reservationDate');
      expect(reservation).toHaveProperty('reservationTime');
      expect(reservation).toHaveProperty('status');
    });
  });

  describe('POST /api/reservations', () => {
    it('should create a new reservation', async () => {
      const table = sampleTables[0];
      // Ensure table is available
      const { tables } = getDataStores();
      const targetTable = tables.find(t => t.number === table.number);
      if (targetTable) {
        targetTable.status = 'available';
      }

      const reservationData = {
        customerName: 'John Doe',
        customerEmail: 'john@example.com',
        customerPhone: '1234567890',
        tableNumber: table.number,
        reservationDate: '2024-12-31',
        reservationTime: '19:00',
        numberOfGuests: 2
      };

      const response = await request(app)
        .post('/api/reservations')
        .send(reservationData)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('customerName', reservationData.customerName);
      expect(response.body).toHaveProperty('customerEmail', reservationData.customerEmail);
      expect(response.body).toHaveProperty('tableNumber', reservationData.tableNumber);
      expect(response.body).toHaveProperty('status', 'confirmed');
    });

    it('should update table status to reserved when reservation is created', async () => {
      const table = sampleTables[0];
      // Ensure table is available
      const { tables: tablesBefore } = getDataStores();
      const targetTable = tablesBefore.find(t => t.number === table.number);
      if (targetTable) {
        targetTable.status = 'available';
      }

      const reservationData = {
        customerName: 'John Doe',
        customerEmail: 'john@example.com',
        customerPhone: '1234567890',
        tableNumber: table.number,
        reservationDate: '2024-12-31',
        reservationTime: '19:00',
        numberOfGuests: 2
      };

      await request(app)
        .post('/api/reservations')
        .send(reservationData)
        .expect(201);

      const { tables: tablesAfter } = getDataStores();
      const updatedTable = tablesAfter.find(t => t.number === table.number);
      expect(updatedTable?.status).toBe('reserved');
    });

    it('should return 400 if table is not available', async () => {
      const table = sampleTables[0];
      // Mark table as occupied
      const { tables } = getDataStores();
      const targetTable = tables.find(t => t.number === table.number);
      if (targetTable) {
        targetTable.status = 'occupied';
      }

      const reservationData = {
        customerName: 'John Doe',
        customerEmail: 'john@example.com',
        customerPhone: '1234567890',
        tableNumber: table.number,
        reservationDate: '2024-12-31',
        reservationTime: '19:00',
        numberOfGuests: 2
      };

      const response = await request(app)
        .post('/api/reservations')
        .send(reservationData)
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Table is not available for reservation');
    });

    it('should return 400 if required fields are missing', async () => {
      const table = sampleTables[0];
      // Ensure table is available first
      const { tables } = getDataStores();
      const targetTable = tables.find(t => t.number === table.number);
      if (targetTable) {
        targetTable.status = 'available';
      }

      const incompleteData = {
        customerName: 'John Doe',
        // Missing reservationDate and reservationTime
        tableNumber: table.number,
        customerEmail: 'john@example.com',
        customerPhone: '1234567890',
        numberOfGuests: 2
      };

      const response = await request(app)
        .post('/api/reservations')
        .send(incompleteData)
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Missing required fields');
    });

    it('should return 400 if table does not exist', async () => {
      const reservationData = {
        customerName: 'John Doe',
        customerEmail: 'john@example.com',
        customerPhone: '1234567890',
        tableNumber: 999, // Non-existent table
        reservationDate: '2024-12-31',
        reservationTime: '19:00',
        numberOfGuests: 2
      };

      const response = await request(app)
        .post('/api/reservations')
        .send(reservationData)
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Table is not available for reservation');
    });
  });

  describe('GET /api/reservations/:id', () => {
    it('should return a specific reservation by ID', async () => {
      // First create a reservation
      const table = sampleTables[0];
      // Ensure table is available
      const { tables } = getDataStores();
      const targetTable = tables.find(t => t.number === table.number);
      if (targetTable) {
        targetTable.status = 'available';
      }

      const createResponse = await request(app)
        .post('/api/reservations')
        .send({
          customerName: 'John Doe',
          customerEmail: 'john@example.com',
          customerPhone: '1234567890',
          tableNumber: table.number,
          reservationDate: '2024-12-31',
          reservationTime: '19:00',
          numberOfGuests: 2
        })
        .expect(201);

      const reservationId = createResponse.body.id;

      const response = await request(app)
        .get(`/api/reservations/${reservationId}`)
        .expect(200);

      expect(response.body).toHaveProperty('id', reservationId);
      expect(response.body).toHaveProperty('customerName', 'John Doe');
    });

    it('should return 404 for non-existent reservation', async () => {
      const response = await request(app)
        .get('/api/reservations/non-existent-id')
        .expect(404);

      expect(response.body).toHaveProperty('error', 'Reservation not found');
    });
  });
});

