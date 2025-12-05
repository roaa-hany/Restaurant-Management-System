/**
 * Backend server for Restaurant Management System
 * Handles API endpoints for menu, reservations, orders, and billing
 */

import express, { Request, Response } from 'express';
import cors from 'cors';
import { sampleMenuItems, sampleReservations, sampleOrders, sampleTables } from './data/sampleData';
import { MenuItem, Reservation, Order, Bill, Table, OrderItem } from './types';

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// In-memory data stores
// We create local copies so we can modify them (CRUD operations)
let reservations: Reservation[] = [...sampleReservations];
let orders: Order[] = [...sampleOrders];
let tables: Table[] = [...sampleTables];
let menuItems: MenuItem[] = [...sampleMenuItems]; // <--- NEW: Mutable menu copy

// Export data stores for testing
export function resetDataStores() {
  reservations = [...sampleReservations];
  orders = [...sampleOrders];
  tables = [...sampleTables];
  menuItems = [...sampleMenuItems];
}

export function getDataStores() {
  return { reservations, orders, tables, menuItems };
}

// ==================== MENU ENDPOINTS ====================

/**
 * GET /api/menu
 * Returns all menu items
 */
app.get('/api/menu', (req: Request, res: Response) => {
  res.json(menuItems); // Changed to use local mutable copy
});

/**
 * GET /api/menu/:id
 * Returns a specific menu item by ID
 */
app.get('/api/menu/:id', (req: Request, res: Response) => {
  const item = menuItems.find(m => m.id === req.params.id);
  if (!item) {
    return res.status(404).json({ error: 'Menu item not found' });
  }
  res.json(item);
});

/** 
 * POST /api/menu
 * Create a new menu item (MISSING IN YOUR ORIGINAL CODE)
 */
app.post('/api/menu', (req: Request, res: Response) => {
    const newItem: MenuItem = {
        id: `item_${Date.now()}`, // Generate ID
        ...req.body
    };
    menuItems.push(newItem);
    res.status(201).json(newItem);
});

/** 
 * PUT /api/menu/:id
 * Update a menu item (MISSING IN YOUR ORIGINAL CODE)
 */
app.put('/api/menu/:id', (req: Request, res: Response) => {
    const index = menuItems.findIndex(m => m.id === req.params.id);
    if (index === -1) {
        return res.status(404).json({ error: 'Menu item not found' });
    }
    // Update existing item with new data
    menuItems[index] = { ...menuItems[index], ...req.body };
    res.json(menuItems[index]);
});

/** 
 * POST /api/menu/:id/toggle-availability
 * Toggle availability (Used by manager dashboard)
 */
app.post('/api/menu/:id/toggle-availability', (req: Request, res: Response) => {
    const item = menuItems.find(m => m.id === req.params.id);
    if (!item) {
        return res.status(404).json({ error: 'Menu item not found' });
    }
    res.json(item);
});

/** 
 * DELETE /api/menu/:id
 * Delete a menu item (MISSING IN YOUR ORIGINAL CODE)
 */
app.delete('/api/menu/:id', (req: Request, res: Response) => {
    const index = menuItems.findIndex(m => m.id === req.params.id);
    if (index === -1) {
        return res.status(404).json({ error: 'Menu item not found' });
    }
    menuItems.splice(index, 1);
    res.status(200).json({ success: true });
});

/**
 * GET /api/menu/category/:category
 * Returns menu items filtered by category
 */
app.get('/api/menu/category/:category', (req: Request, res: Response) => {
  const category = req.params.category as MenuItem['category'];
  const filtered = menuItems.filter(m => m.category === category);
  res.json(filtered);
});

// ==================== TABLE ENDPOINTS ====================

/**
 * GET /api/tables
 * Returns all tables
 */
app.get('/api/tables', (req: Request, res: Response) => {
  res.json(tables);
});

/**
 * POST /api/tables
 * Create a new table (MISSING IN YOUR ORIGINAL CODE)
 */
app.post('/api/tables', (req: Request, res: Response) => {
    const newTable: Table = {
        id: `table_${Date.now()}`,
        ...req.body
    };
    tables.push(newTable);
    res.status(201).json(newTable);
});

/**
 * PUT /api/tables/:id
 * Update generic table info (Capacity/Location) (MISSING IN YOUR ORIGINAL CODE)
 */
app.put('/api/tables/:id', (req: Request, res: Response) => {
    const index = tables.findIndex(t => t.id === req.params.id);
    if (index === -1) {
        return res.status(404).json({ error: 'Table not found' });
    }
    tables[index] = { ...tables[index], ...req.body };
    res.json(tables[index]);
});

/**
 * DELETE /api/tables/:id
 * Delete a table (MISSING IN YOUR ORIGINAL CODE)
 */
app.delete('/api/tables/:id', (req: Request, res: Response) => {
    const index = tables.findIndex(t => t.id === req.params.id);
    if (index === -1) {
        return res.status(404).json({ error: 'Table not found' });
    }
    tables.splice(index, 1);
    res.status(200).json({ success: true });
});

/**
 * GET /api/tables/available
 * Returns available tables for reservations
 */
app.get('/api/tables/available', (req: Request, res: Response) => {
  const availableTables = tables.filter(table => table.status === 'available');
  res.json(availableTables);
});

/**
 * PUT /api/tables/:id/status
 * Updates table status (Used by Waiter)
 */
app.put('/api/tables/:id/status', (req: Request, res: Response) => {
  const table = tables.find(t => t.id === req.params.id);
  if (!table) {
    return res.status(404).json({ error: 'Table not found' });
  }

  const { status, assignedWaiter } = req.body;
  
  if (status) table.status = status;
  if (assignedWaiter !== undefined) table.assignedWaiter = assignedWaiter;
  
  res.json(table);
});

/**
 * POST /api/tables/:id/assign
 * Assigns table to waiter
 */
app.post('/api/tables/:id/assign', (req: Request, res: Response) => {
  const table = tables.find(t => t.id === req.params.id);
  if (!table) {
    return res.status(404).json({ error: 'Table not found' });
  }

  const { waiterId } = req.body;
  
  table.assignedWaiter = waiterId;
  table.status = 'occupied';
  
  res.json(table);
});

/**
 * POST /api/tables/:id/assist
 * Marks table as needing assistance
 */
app.post('/api/tables/:id/assist', (req: Request, res: Response) => {
  const table = tables.find(t => t.id === req.params.id);
  if (!table) {
    return res.status(404).json({ error: 'Table not found' });
  }

  table.status = 'need-assistance';
  res.json(table);
});


// ==================== RESERVATION ENDPOINTS ====================

/**
 * GET /api/reservations
 * Returns all reservations
 */
app.get('/api/reservations', (req: Request, res: Response) => {
  res.json(reservations);
});

/**
 * POST /api/reservations
 * Creates a new reservation
 */
app.post('/api/reservations', (req: Request, res: Response) => {
  const { tableNumber, reservationDate, reservationTime } = req.body;

  // Check if table is available
  const table = tables.find(t => t.number === tableNumber);
  // Note: For a real app, you'd check if the table is reserved *at that specific time*
  // simplifying here for sprint 1
  
  const reservation: Reservation = {
    id: `res_${Date.now()}`,
    customerName: req.body.customerName,
    customerEmail: req.body.customerEmail,
    customerPhone: req.body.customerPhone,
    tableNumber: tableNumber,
    reservationDate: reservationDate,
    reservationTime: reservationTime,
    numberOfGuests: req.body.numberOfGuests,
    status: 'pending' // Default to pending so manager can confirm
  };

  reservations.push(reservation);
  res.status(201).json(reservation);
});

/**
 * POST /api/reservations/:id/confirm
 * Manager confirms reservation (MISSING IN YOUR ORIGINAL CODE)
 */
app.post('/api/reservations/:id/confirm', (req: Request, res: Response) => {
    const reservation = reservations.find(r => r.id === req.params.id);
    if (!reservation) {
        return res.status(404).json({ error: 'Reservation not found' });
    }
    reservation.status = 'confirmed';
    
    // Also update table status
    const table = tables.find(t => t.number === reservation.tableNumber);
    if (table) table.status = 'reserved';

    res.json(reservation);
});

/**
 * POST /api/reservations/:id/cancel
 * Manager cancels reservation (MISSING IN YOUR ORIGINAL CODE)
 */
app.post('/api/reservations/:id/cancel', (req: Request, res: Response) => {
    const reservation = reservations.find(r => r.id === req.params.id);
    if (!reservation) {
        return res.status(404).json({ error: 'Reservation not found' });
    }
    reservation.status = 'cancelled';
    
    // Free up table if needed
    const table = tables.find(t => t.number === reservation.tableNumber);
    if (table && table.status === 'reserved') table.status = 'available';

    res.json(reservation);
});

/**
 * GET /api/reservations/:id
 * Returns a specific reservation by ID
 */
app.get('/api/reservations/:id', (req: Request, res: Response) => {
  const reservation = reservations.find(r => r.id === req.params.id);
  if (!reservation) {
    return res.status(404).json({ error: 'Reservation not found' });
  }
  res.json(reservation);
});

// ==================== ORDER ENDPOINTS ====================

/**
 * GET /api/orders
 * Returns all orders
 */
app.get('/api/orders', (req: Request, res: Response) => {
  res.json(orders);
});

/**
 * POST /api/orders
 * Creates a new order
 */
app.post('/api/orders', (req: Request, res: Response) => {
  const { tableNumber, items, assignedWaiter, customerName } = req.body;

  // Check if table exists
  const table = tables.find(t => t.number === tableNumber);
  if (!table) {
    return res.status(400).json({ error: 'Table not found' });
  }

  const order: Order = {
    id: `order_${Date.now()}`,
    tableNumber: tableNumber,
    items: items,
    status: 'pending',
    createdAt: new Date().toISOString(),
    assignedWaiter: assignedWaiter,
    customerName: customerName
  };

  if (!order.tableNumber || !order.items || order.items.length === 0) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // Update table status
  table.status = 'occupied';
  table.assignedWaiter = assignedWaiter;
  table.currentOrder = order.id;

  orders.push(order);
  res.status(201).json(order);
});

/**
 * GET /api/orders/:id
 * Returns a specific order by ID
 */
app.get('/api/orders/:id', (req: Request, res: Response) => {
  const order = orders.find(o => o.id === req.params.id);
  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }
  res.json(order);
});

/**
 * PUT /api/orders/:id/status
 * Updates order status
 */
app.put('/api/orders/:id/status', (req: Request, res: Response) => {
  const order = orders.find(o => o.id === req.params.id);
  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }

  const { status } = req.body;
  order.status = status;

  // If order is paid, mark table as available
  if (status === 'paid') {
    const table = tables.find(t => t.number === order.tableNumber);
    if (table) {
      table.status = 'available';
      table.assignedWaiter = undefined;
      table.currentOrder = undefined;
    }
  }

  res.json(order);
});

// ==================== BILLING ENDPOINTS ====================

/**
 * POST /api/bills/generate
 * Generates a bill for an order
 */
app.post('/api/bills/generate', (req: Request, res: Response) => {
  const { orderId } = req.body;
  const order = orders.find(o => o.id === orderId);

  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }

  // Calculate totals
  const subtotal = order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const tax = subtotal * 0.1; // 10% tax
  const total = subtotal + tax;

  const bill: Bill = {
    id: `bill_${Date.now()}`,
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

  res.status(201).json(bill);
});

/**
 * POST /api/bills/:id/pay
 * Processes payment for a bill and updates table status
 */
app.post('/api/bills/:id/pay', (req: Request, res: Response) => {
  const { paymentMethod, orderId } = req.body;
  
  // Find order by orderId from request body (passed from frontend)
  // If not provided, try to extract from billId (for backward compatibility)
  let targetOrderId = orderId;
  if (!targetOrderId) {
    const billId = req.params.id;
    targetOrderId = billId.replace('bill_', 'order_');
  }
  
  const order = orders.find(o => o.id === targetOrderId);
  
  if (order) {
    order.status = 'paid';
    
    // Mark table as available
    const table = tables.find(t => t.number === order.tableNumber);
    if (table) {
      table.status = 'available';
      table.assignedWaiter = undefined;
      table.currentOrder = undefined;
    }
  }

  res.json({ 
    success: true, 
    message: 'Payment processed successfully',
    billId: req.params.id,
    paymentMethod: paymentMethod
  });
});

// ==================== WAITER STATS ENDPOINTS ====================

/**
 * GET /api/waiters/:id/stats
 * Returns waiter statistics
 */
app.get('/api/waiters/:id/stats', (req: Request, res: Response) => {
  const waiterId = req.params.id;
  
  const waiterOrders = orders.filter(order => order.assignedWaiter === waiterId);
  const activeTables = tables.filter(table => table.assignedWaiter === waiterId && table.status === 'occupied');
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
});

// ==================== AUTHENTICATION ENDPOINTS ====================

/**
 * Simple user credentials (in production, use a database)
 */
const users = {
  waiter: { username: 'waiter', password: 'waiter123', role: 'waiter', name: 'Ahmed Waiter' },
  manager: { username: 'manager', password: 'manager123', role: 'manager', name: 'Manager' }
};

/**
 * POST /api/auth/login
 * Authenticates staff members (waiter or manager)
 */
app.post('/api/auth/login', (req: Request, res: Response) => {
  const { username, password, role } = req.body;

  if (!username || !password || !role) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // Check if user exists
  const user = users[username as keyof typeof users];
  
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
    id: username,
    token: token
  });
});

// Export app for testing
export { app };

// Start server only if this file is run directly
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`API endpoints available at http://localhost:${PORT}/api`);
    console.log(`Customer menu: http://localhost:${PORT}/index.html`);
    console.log(`Staff login: http://localhost:${PORT}/login.html`);
  });
}