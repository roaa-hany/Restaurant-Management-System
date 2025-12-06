/**
 * Backend server for Restaurant Management System
 * Handles API endpoints for menu, reservations, orders, billing, and feedback
 * Uses MySQL database for persistent storage
 */

// Load environment variables from .env file
import 'dotenv/config';

import express, { Request, Response } from 'express';
import cors from 'cors';
import { testConnection } from './db/config';
import { initializeDatabase } from './db/init';
import * as db from './db/queries';
import { MenuItem, Reservation, Order, Bill, Table, Feedback } from './types';

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// ==================== MENU ENDPOINTS ====================

/**
 * GET /api/menu
 * Returns all menu items
 */
app.get('/api/menu', async (req: Request, res: Response) => {
  try {
    const menuItems = await db.getAllMenuItems();
    res.json(menuItems);
  } catch (error) {
    console.error('Error fetching menu items:', error);
    res.status(500).json({ error: 'Failed to fetch menu items' });
  }
});

/**
 * GET /api/menu/:id
 * Returns a specific menu item by ID
 */
app.get('/api/menu/:id', async (req: Request, res: Response) => {
  try {
    const item = await db.getMenuItemById(req.params.id);
    if (!item) {
      return res.status(404).json({ error: 'Menu item not found' });
    }
    res.json(item);
  } catch (error) {
    console.error('Error fetching menu item:', error);
    res.status(500).json({ error: 'Failed to fetch menu item' });
  }
});

/**
 * POST /api/menu
 * Create new menu item
 */
app.post('/api/menu', async (req: Request, res: Response) => {
  try {
    const newItem: MenuItem = {
      id: `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: req.body.name,
      description: req.body.description,
      price: parseFloat(req.body.price),
      category: req.body.category,
      imageUrl: req.body.imageUrl || '',
      ingredients: req.body.ingredients || [],
      allergens: req.body.allergens || [],
      available: req.body.available !== undefined ? req.body.available : true
    };

    const created = await db.createMenuItem(newItem);
    res.status(201).json(created);
  } catch (error) {
    console.error('Error creating menu item:', error);
    res.status(500).json({ error: 'Failed to create menu item' });
  }
});

/**
 * PUT /api/menu/:id
 * Update menu item
 */
app.put('/api/menu/:id', async (req: Request, res: Response) => {
  try {
    const updated = await db.updateMenuItem(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ error: 'Menu item not found' });
    }
    res.json(updated);
  } catch (error) {
    console.error('Error updating menu item:', error);
    res.status(500).json({ error: 'Failed to update menu item' });
  }
});

/**
 * DELETE /api/menu/:id
 * Delete a menu item
 */
app.delete('/api/menu/:id', async (req: Request, res: Response) => {
  try {
    const deleted = await db.deleteMenuItem(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: 'Menu item not found' });
    }
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting menu item:', error);
    res.status(500).json({ error: 'Failed to delete menu item' });
  }
});

/**
 * POST /api/menu/:id/toggle-availability
 * Toggle menu item availability
 */
app.post('/api/menu/:id/toggle-availability', async (req: Request, res: Response) => {
  try {
    const updated = await db.updateMenuItem(req.params.id, { available: req.body.available });
    if (!updated) {
      return res.status(404).json({ error: 'Menu item not found' });
    }
    res.json(updated);
  } catch (error) {
    console.error('Error toggling menu item availability:', error);
    res.status(500).json({ error: 'Failed to update menu item availability' });
  }
});

// ==================== TABLE ENDPOINTS ====================

/**
 * GET /api/tables
 * Returns all tables
 */
app.get('/api/tables', async (req: Request, res: Response) => {
  try {
    const tables = await db.getAllTables();
    res.json(tables);
  } catch (error) {
    console.error('Error fetching tables:', error);
    res.status(500).json({ error: 'Failed to fetch tables' });
  }
});

/**
 * POST /api/tables
 * Create a new table
 */
app.post('/api/tables', async (req: Request, res: Response) => {
  try {
    const newTable: Table = {
      id: `table_${Date.now()}`,
      number: req.body.tableNumber,
      capacity: req.body.capacity,
      status: req.body.status || 'available',
      location: req.body.location
    };
    const created = await db.createTable(newTable);
    res.status(201).json(created);
  } catch (error) {
    console.error('Error creating table:', error);
    res.status(500).json({ error: 'Failed to create table' });
  }
});

/**
 * PUT /api/tables/:id
 * Update generic table info (Capacity/Location)
 */
app.put('/api/tables/:id', async (req: Request, res: Response) => {
  try {
    const updates: Partial<Table> = {};
    if (req.body.tableNumber !== undefined) updates.number = req.body.tableNumber;
    if (req.body.capacity !== undefined) updates.capacity = req.body.capacity;
    if (req.body.status !== undefined) updates.status = req.body.status;
    if (req.body.location !== undefined) updates.location = req.body.location;

    const updated = await db.updateTable(req.params.id, updates);
    if (!updated) {
      return res.status(404).json({ error: 'Table not found' });
    }
    res.json(updated);
  } catch (error) {
    console.error('Error updating table:', error);
    res.status(500).json({ error: 'Failed to update table' });
  }
});

/**
 * DELETE /api/tables/:id
 * Delete a table
 */
app.delete('/api/tables/:id', async (req: Request, res: Response) => {
  try {
    const deleted = await db.deleteTable(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: 'Table not found' });
    }
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error deleting table:', error);
    res.status(500).json({ error: 'Failed to delete table' });
  }
});

/**
 * GET /api/tables/available
 * Returns available tables for reservations
 */
app.get('/api/tables/available', async (req: Request, res: Response) => {
  try {
    const availableTables = await db.getAvailableTables();
    res.json(availableTables);
  } catch (error) {
    console.error('Error fetching available tables:', error);
    res.status(500).json({ error: 'Failed to fetch available tables' });
  }
});

/**
 * PUT /api/tables/:id/status
 * Updates table status
 */
app.put('/api/tables/:id/status', async (req: Request, res: Response) => {
  try {
    const updates: Partial<Table> = {};
    if (req.body.status) updates.status = req.body.status;
    if (req.body.assignedWaiter !== undefined) updates.assignedWaiter = req.body.assignedWaiter;

    const updated = await db.updateTable(req.params.id, updates);
    if (!updated) {
      return res.status(404).json({ error: 'Table not found' });
    }
    res.json(updated);
  } catch (error) {
    console.error('Error updating table status:', error);
    res.status(500).json({ error: 'Failed to update table status' });
  }
});

/**
 * POST /api/tables/:id/assign
 * Assigns table to waiter
 */
app.post('/api/tables/:id/assign', async (req: Request, res: Response) => {
  try {
    const { waiterId } = req.body;
    const updated = await db.updateTable(req.params.id, {
      assignedWaiter: waiterId,
      status: 'occupied'
    });
    if (!updated) {
      return res.status(404).json({ error: 'Table not found' });
    }
    res.json(updated);
  } catch (error) {
    console.error('Error assigning table:', error);
    res.status(500).json({ error: 'Failed to assign table' });
  }
});

/**
 * POST /api/tables/:id/assist
 * Marks table as needing assistance
 */
app.post('/api/tables/:id/assist', async (req: Request, res: Response) => {
  try {
    const updated = await db.updateTable(req.params.id, { status: 'need-assistance' });
    if (!updated) {
      return res.status(404).json({ error: 'Table not found' });
    }
    res.json(updated);
  } catch (error) {
    console.error('Error updating table assistance:', error);
    res.status(500).json({ error: 'Failed to update table status' });
  }
});

// ==================== RESERVATION ENDPOINTS ====================

/**
 * GET /api/reservations
 * Returns all reservations
 */
app.get('/api/reservations', async (req: Request, res: Response) => {
  try {
    const reservations = await db.getAllReservations();
    res.json(reservations);
  } catch (error) {
    console.error('Error fetching reservations:', error);
    res.status(500).json({ error: 'Failed to fetch reservations' });
  }
});

/**
 * POST /api/reservations
 * Creates a new reservation
 */
app.post('/api/reservations', async (req: Request, res: Response) => {
  try {
    const { tableNumber, reservationDate, reservationTime, endTime, numberOfGuests } = req.body;

    // Validate required fields
    if (!tableNumber || !reservationDate || !reservationTime || !endTime || !numberOfGuests) {
      return res.status(400).json({ error: 'Missing required fields: tableNumber, reservationDate, reservationTime, endTime, and numberOfGuests are required' });
    }

    // Validate reservation date is not in the past
    const reservationDateTime = new Date(`${reservationDate}T${reservationTime}`);
    const now = new Date();
    if (reservationDateTime < now) {
      return res.status(400).json({ error: 'Reservation date and time cannot be in the past' });
    }

    // Validate time range
    if (endTime <= reservationTime) {
      return res.status(400).json({ error: 'End time must be after start time' });
    }

    // Check if table exists
    const table = await db.getTableByNumber(tableNumber);
    if (!table) {
      return res.status(400).json({ error: 'Table not found' });
    }

    // Validate number of guests is within table capacity
    if (numberOfGuests < 1) {
      return res.status(400).json({ error: 'Number of guests must be at least 1' });
    }
    if (numberOfGuests > table.capacity) {
      return res.status(400).json({ error: `Number of guests (${numberOfGuests}) exceeds table capacity (${table.capacity})` });
    }

    // Check for time conflicts
    const conflictingReservations = await db.getConflictingReservations(
      tableNumber,
      reservationDate,
      reservationTime,
      endTime
    );

    if (conflictingReservations.length > 0) {
      return res.status(409).json({ 
        error: `Table ${tableNumber} is already reserved for this time slot. Please choose a different time or table.` 
      });
    }

    const reservation: Reservation = {
      id: `res_${Date.now()}`,
      customerName: req.body.customerName,
      customerEmail: req.body.customerEmail,
      customerPhone: req.body.customerPhone,
      tableNumber: tableNumber,
      reservationDate: reservationDate,
      reservationTime: reservationTime,
      endTime: endTime,
      numberOfGuests: req.body.numberOfGuests,
      status: 'pending'
    };

    const created = await db.createReservation(reservation);
    res.status(201).json(created);
  } catch (error: any) {
    console.error('Error creating reservation:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Reservation conflict detected' });
    }
    res.status(500).json({ error: 'Failed to create reservation' });
  }
});

/**
 * POST /api/reservations/:id/confirm
 * Manager confirms reservation
 */
app.post('/api/reservations/:id/confirm', async (req: Request, res: Response) => {
  try {
    const reservation = await db.updateReservationStatus(req.params.id, 'confirmed');
    if (!reservation) {
      return res.status(404).json({ error: 'Reservation not found' });
    }
    res.json(reservation);
  } catch (error) {
    console.error('Error confirming reservation:', error);
    res.status(500).json({ error: 'Failed to confirm reservation' });
  }
});

/**
 * POST /api/reservations/:id/cancel
 * Manager cancels reservation
 */
app.post('/api/reservations/:id/cancel', async (req: Request, res: Response) => {
  try {
    const reservation = await db.updateReservationStatus(req.params.id, 'cancelled');
    if (!reservation) {
      return res.status(404).json({ error: 'Reservation not found' });
    }
    res.json(reservation);
  } catch (error) {
    console.error('Error cancelling reservation:', error);
    res.status(500).json({ error: 'Failed to cancel reservation' });
  }
});

/**
 * GET /api/reservations/:id
 * Returns a specific reservation by ID
 */
app.get('/api/reservations/:id', async (req: Request, res: Response) => {
  try {
    const reservation = await db.getReservationById(req.params.id);
    if (!reservation) {
      return res.status(404).json({ error: 'Reservation not found' });
    }
    res.json(reservation);
  } catch (error) {
    console.error('Error fetching reservation:', error);
    res.status(500).json({ error: 'Failed to fetch reservation' });
  }
});

// ==================== ORDER ENDPOINTS ====================

/**
 * GET /api/orders
 * Returns all orders (with optional status filter)
 */
app.get('/api/orders', async (req: Request, res: Response) => {
  try {
    const statusFilter = req.query.status as string;
    const statuses = statusFilter ? statusFilter.split(',') : undefined;
    
    let orders = await db.getAllOrders(statuses);
    
    // Add item names to orders
    const menuItems = await db.getAllMenuItems();
    const ordersWithNames = orders.map(order => ({
      ...order,
      items: order.items.map(item => {
        const menuItem = menuItems.find(m => m.id === item.menuItemId);
        return {
          ...item,
          name: menuItem ? menuItem.name : 'Unknown Item'
        };
      })
    }));

    res.json(ordersWithNames);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

/**
 * POST /api/orders
 * Creates a new order
 */
app.post('/api/orders', async (req: Request, res: Response) => {
  try {
    const { tableNumber, items, assignedWaiter, customerName } = req.body;

    // Check if table exists
    const table = await db.getTableByNumber(tableNumber);
    if (!table) {
      return res.status(400).json({ error: 'Table not found' });
    }

    if (!items || items.length === 0) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Validate assignedWaiter exists in staff table if provided
    let validWaiterId: string | undefined = undefined;
    if (assignedWaiter) {
      const waiter = await db.getStaffById(assignedWaiter);
      if (!waiter) {
        console.warn(`Warning: assignedWaiter '${assignedWaiter}' not found in staff table. Setting to null.`);
        // Don't fail - just set to null
        validWaiterId = undefined;
      } else {
        validWaiterId = assignedWaiter;
      }
    }

    const order: Order = {
      id: `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      tableNumber: tableNumber,
      items: items,
      status: 'pending',
      createdAt: new Date().toISOString(),
      assignedWaiter: validWaiterId,
      customerName: customerName
    };

    const created = await db.createOrder(order);

    // Update table status
    await db.updateTable(table.id, {
      status: 'occupied',
      assignedWaiter: validWaiterId,
      currentOrder: order.id
    });

    res.status(201).json(created);
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ error: 'Failed to create order' });
  }
});

/**
 * GET /api/orders/:id
 * Returns a specific order by ID
 */
app.get('/api/orders/:id', async (req: Request, res: Response) => {
  try {
    const order = await db.getOrderById(req.params.id);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    // Add item names
    const menuItems = await db.getAllMenuItems();
    const orderWithNames = {
      ...order,
      items: order.items.map(item => {
        const menuItem = menuItems.find(m => m.id === item.menuItemId);
        return {
          ...item,
          name: menuItem ? menuItem.name : 'Unknown Item'
        };
      })
    };
    
    res.json(orderWithNames);
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({ error: 'Failed to fetch order' });
  }
});

/**
 * PUT /api/orders/:id/status
 * Updates order status (unified endpoint for all status changes)
 */
app.put('/api/orders/:id/status', async (req: Request, res: Response) => {
  try {
    const { status, assignedChef, chefName, estimatedPrepTime, startTime } = req.body;

    const updates: any = {};
    if (assignedChef) updates.assignedChef = assignedChef;
    if (chefName) updates.chefName = chefName;
    if (estimatedPrepTime) updates.estimatedPrepTime = estimatedPrepTime;
    if (startTime) updates.startTime = startTime;

    const updated = await db.updateOrderStatus(req.params.id, status, updates);
    if (!updated) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // If order is paid, mark table as available
    if (status === 'paid') {
      const table = await db.getTableByNumber(updated.tableNumber);
      if (table) {
        await db.updateTable(table.id, {
          status: 'available',
          assignedWaiter: undefined,
          currentOrder: undefined
        });
      }
    }

    res.json(updated);
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ error: 'Failed to update order status' });
  }
});

// ==================== BILLING ENDPOINTS ====================

/**
 * POST /api/bills/generate
 * Generates a bill for an order
 */
app.post('/api/bills/generate', async (req: Request, res: Response) => {
  try {
    const { orderId } = req.body;
    const order = await db.getOrderById(orderId);

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Calculate totals
    const subtotal = order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const tax = subtotal * 0.1; // 10% tax
    const total = subtotal + tax;

    const bill: Bill = {
      id: `BILL_${orderId}`, // Fixed: Use BILL_ prefix to match frontend
      orderId: order.id,
      tableNumber: order.tableNumber,
      items: order.items,
      subtotal: Math.round(subtotal * 100) / 100,
      tax: Math.round(tax * 100) / 100,
      total: Math.round(total * 100) / 100,
      paymentMethod: req.body.paymentMethod || 'cash',
      paymentStatus: 'pending',
      createdAt: new Date().toISOString()
    };

    const created = await db.createBill(bill);
    res.status(201).json(created);
  } catch (error) {
    console.error('Error generating bill:', error);
    res.status(500).json({ error: 'Failed to generate bill' });
  }
});

/**
 * POST /api/bills/:id/pay
 * Processes payment for a bill and updates table status
 * This endpoint:
 * 1. Updates order status to 'paid'
 * 2. Marks the table as 'available'
 * 3. Removes waiter assignment from table
 */
app.post('/api/bills/:id/pay', async (req: Request, res: Response) => {
  try {
    const { paymentMethod } = req.body;
    const billId = req.params.id;

    // Extract order ID from bill ID (BILL_order_xxx or bill_order_xxx)
    let orderId = billId.replace(/^BILL_/, '').replace(/^bill_/, '');
    
    // If bill ID doesn't start with BILL_ or bill_, try to get bill from DB
    if (!billId.startsWith('BILL_') && !billId.startsWith('bill_')) {
      const bill = await db.getBillById(billId);
      if (bill) {
        orderId = bill.orderId;
      } else {
        return res.status(404).json({ error: 'Bill not found' });
      }
    }

    // Get order
    const order = await db.getOrderById(orderId);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Update bill payment status
    await db.updateBillPayment(billId, paymentMethod);

    // Update order status to paid
    await db.updateOrderStatus(orderId, 'paid');

    // Mark table as available and remove waiter assignment
    const table = await db.getTableByNumber(order.tableNumber);
    if (table) {
      await db.updateTable(table.id, {
        status: 'available',
        assignedWaiter: undefined,
        currentOrder: undefined
      });
    }

    res.json({
      success: true,
      message: 'Payment processed successfully',
      billId: billId,
      paymentMethod: paymentMethod
    });
  } catch (error) {
    console.error('Error processing payment:', error);
    res.status(500).json({ error: 'Failed to process payment' });
  }
});

// ==================== FEEDBACK ENDPOINTS ====================

/**
 * GET /api/feedback
 * Returns all feedback
 */
app.get('/api/feedback', async (req: Request, res: Response) => {
  try {
    const feedback = await db.getAllFeedback();
    res.json(feedback);
  } catch (error) {
    console.error('Error fetching feedback:', error);
    res.status(500).json({ error: 'Failed to fetch feedback' });
  }
});

/**
 * POST /api/feedback
 * Creates a new feedback entry
 */
app.post('/api/feedback', async (req: Request, res: Response) => {
  try {
    const { customerName, customerEmail, rating, comment } = req.body;

    // Validate required fields
    if (!customerName || !customerEmail || !rating || !comment) {
      return res.status(400).json({ error: 'Missing required fields: customerName, customerEmail, rating, and comment are required' });
    }

    // Validate rating range
    if (rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }

    const feedback: Feedback = {
      id: `feedback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      customerName,
      customerEmail,
      rating: parseInt(rating),
      comment,
      createdAt: new Date().toISOString(),
      status: 'pending'
    };

    const created = await db.createFeedback(feedback);
    res.status(201).json(created);
  } catch (error) {
    console.error('Error creating feedback:', error);
    res.status(500).json({ error: 'Failed to create feedback' });
  }
});

// ==================== WAITER STATS ENDPOINTS ====================

/**
 * GET /api/waiters/:id/stats
 * Returns waiter statistics
 */
app.get('/api/waiters/:id/stats', async (req: Request, res: Response) => {
  try {
    const waiterId = req.params.id;

    const allOrders = await db.getAllOrders();
    const waiterOrders = allOrders.filter(order => order.assignedWaiter === waiterId);
    
    const allTables = await db.getAllTables();
    const activeTables = allTables.filter(table => table.assignedWaiter === waiterId && table.status === 'occupied');
    const pendingOrders = waiterOrders.filter(order => order.status === 'pending' || order.status === 'preparing');

    const today = new Date().toISOString().split('T')[0];
    const todayOrders = waiterOrders.filter(order => order.createdAt.startsWith(today));
    const todayRevenue = todayOrders.reduce((sum, order) => {
      return sum + order.items.reduce((orderSum, item) => orderSum + (item.price * item.quantity), 0);
    }, 0);

    const stats = {
      activeTables: activeTables.length,
      pendingOrders: pendingOrders.length,
      todayRevenue: Math.round(todayRevenue * 100) / 100,
      avgServiceTime: 25, // Mock data
      totalTablesServed: waiterOrders.filter(order => order.status === 'paid').length,
      totalRevenue: Math.round(todayRevenue * 1.5 * 100) / 100, // Mock data
      customerRating: 4.7, // Mock data
      orderAccuracy: 98 // Mock data
    };

    res.json(stats);
  } catch (error) {
    console.error('Error fetching waiter stats:', error);
    res.status(500).json({ error: 'Failed to fetch waiter statistics' });
  }
});

// ==================== AUTHENTICATION ENDPOINTS ====================

/**
 * POST /api/auth/login
 * Authenticates staff members (waiter, manager, or kitchen)
 */
app.post('/api/auth/login', async (req: Request, res: Response) => {
  try {
    const { username, password, role } = req.body;

    if (!username || !password || !role) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Get user from database
    const user = await db.getStaffByUsername(username);

    if (!user || user.password !== password || user.role !== role) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate simple token (in production, use JWT or similar)
    const token = `token_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    res.json({
      success: true,
      username: user.username,
      role: user.role,
      name: user.name,
      id: user.id,
      token: token
    });
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ error: 'Failed to authenticate' });
  }
});

// ==================== KITCHEN ORDER ENDPOINTS ====================

/**
 * GET /api/kitchen/orders
 * Returns orders in a shape friendly for the kitchen dashboard
 */
app.get('/api/kitchen/orders', async (req: Request, res: Response) => {
  try {
    let orders = await db.getAllOrders();
    const menuItems = await db.getAllMenuItems();
    
    const kitchenOrders = orders.map(order => ({
      ...order,
      items: order.items.map(item => {
        const menuItem = menuItems.find(m => m.id === item.menuItemId);
        return {
          ...item,
          name: menuItem ? menuItem.name : 'Unknown Item'
        };
      })
    }));

    res.json(kitchenOrders);
  } catch (error) {
    console.error('Error fetching kitchen orders:', error);
    res.status(500).json({ error: 'Failed to fetch kitchen orders' });
  }
});

/**
 * POST /api/kitchen/orders/:id/accept
 * Chef accepts an order and sets estimated prep time
 */
app.post('/api/kitchen/orders/:id/accept', async (req: Request, res: Response) => {
  try {
    const { chefId, chefName, estimatedPrepTime } = req.body;
    if (!estimatedPrepTime || estimatedPrepTime <= 0) {
      return res.status(400).json({ error: 'Invalid estimated preparation time' });
    }

    const updated = await db.updateOrderStatus(req.params.id, 'preparing', {
      assignedChef: chefId,
      chefName: chefName,
      estimatedPrepTime: estimatedPrepTime,
      startTime: new Date().toISOString()
    });

    if (!updated) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json(updated);
  } catch (error) {
    console.error('Error accepting order:', error);
    res.status(500).json({ error: 'Failed to accept order' });
  }
});

/**
 * POST /api/kitchen/orders/:id/complete
 * Chef finishes cooking – order becomes READY for the waiter
 */
app.post('/api/kitchen/orders/:id/complete', async (req: Request, res: Response) => {
  try {
    const updated = await db.updateOrderStatus(req.params.id, 'ready');
    if (!updated) {
      return res.status(404).json({ error: 'Order not found' });
    }
    res.json(updated);
  } catch (error) {
    console.error('Error completing order:', error);
    res.status(500).json({ error: 'Failed to complete order' });
  }
});

/**
 * POST /api/kitchen/orders/:id/served
 * Marks order as served to the customer (from kitchen point of view)
 */
app.post('/api/kitchen/orders/:id/served', async (req: Request, res: Response) => {
  try {
    const updated = await db.updateOrderStatus(req.params.id, 'served');
    if (!updated) {
      return res.status(404).json({ error: 'Order not found' });
    }
    res.json(updated);
  } catch (error) {
    console.error('Error marking order as served:', error);
    res.status(500).json({ error: 'Failed to update order status' });
  }
});

// Initialize database and start server
async function startServer() {
  try {
    // First, create the database if it doesn't exist
    const dbName = process.env.DB_NAME || 'restaurant_db';
    try {
      const { adminPool } = await import('./db/config');
      await adminPool.execute(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
      console.log(`✓ Database '${dbName}' ready`);
    } catch (error: any) {
      console.warn('⚠ Could not create database:', error.message);
      // Continue - might already exist or will be created by schema
    }

    // Initialize database schema and seed data (this will create tables)
    await initializeDatabase();

    // Test database connection after initialization
    const connected = await testConnection();
    if (!connected) {
      console.error('Failed to connect to database. Please check your MySQL configuration.');
      process.exit(1);
    }

    // Start server
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
      console.log(`API endpoints available at http://localhost:${PORT}/api`);
      console.log(`Customer menu: http://localhost:${PORT}/index.html`);
      console.log(`Staff login: http://localhost:${PORT}/login.html`);
      console.log('\nTest credentials:');
      console.log('  Waiter:  username: waiter,  password: waiter123');
      console.log('  Manager: username: manager, password: manager123');
      console.log('  Kitchen: username: chef1,   password: chef123');
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
