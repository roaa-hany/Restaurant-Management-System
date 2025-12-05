"use strict";
/**
 * Backend server for Restaurant Management System
 * Handles API endpoints for menu, reservations, orders, and billing
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const sampleData_1 = require("./data/sampleData");
const app = (0, express_1.default)();
const PORT = 3000;
// Middleware
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use(express_1.default.static('public'));
// In-memory data stores (in a real app, these would be databases)
// NOTE: Data is stored in server memory and will be lost when the server restarts.
// For production, this should be replaced with a database (MongoDB, PostgreSQL, etc.)
let reservations = [...sampleData_1.sampleReservations];
let orders = [...sampleData_1.sampleOrders];
let tables = [...sampleData_1.sampleTables];
// ==================== MENU ENDPOINTS ====================
/**
 * GET /api/menu
 * Returns all menu items
 */
app.get('/api/menu', (req, res) => {
    res.json(sampleData_1.sampleMenuItems);
});
/**
 * GET /api/menu/:id
 * Returns a specific menu item by ID
 */
app.get('/api/menu/:id', (req, res) => {
    const item = sampleData_1.sampleMenuItems.find(m => m.id === req.params.id);
    if (!item) {
        return res.status(404).json({ error: 'Menu item not found' });
    }
    res.json(item);
});
// ==================== TABLE ENDPOINTS ====================
/**
 * GET /api/tables
 * Returns all tables
 */
app.get('/api/tables', (req, res) => {
    res.json(tables);
});
/**
 * GET /api/tables/available
 * Returns available tables for reservations
 */
app.get('/api/tables/available', (req, res) => {
    const availableTables = tables.filter(table => table.status === 'available');
    res.json(availableTables);
});
/**
 * PUT /api/tables/:id/status
 * Updates table status
 */
app.put('/api/tables/:id/status', (req, res) => {
    const table = tables.find(t => t.id === req.params.id);
    if (!table) {
        return res.status(404).json({ error: 'Table not found' });
    }
    const { status, assignedWaiter } = req.body;
    if (status)
        table.status = status;
    if (assignedWaiter !== undefined)
        table.assignedWaiter = assignedWaiter;
    res.json(table);
});
/**
 * POST /api/tables/:id/assign
 * Assigns table to waiter
 */
app.post('/api/tables/:id/assign', (req, res) => {
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
app.post('/api/tables/:id/assist', (req, res) => {
    const table = tables.find(t => t.id === req.params.id);
    if (!table) {
        return res.status(404).json({ error: 'Table not found' });
    }
    table.status = 'need-assistance';
    res.json(table);
});
/**
 * GET /api/menu/category/:category
 * Returns menu items filtered by category
 */
app.get('/api/menu/category/:category', (req, res) => {
    const category = req.params.category;
    const filtered = sampleData_1.sampleMenuItems.filter(m => m.category === category);
    res.json(filtered);
});
// ==================== RESERVATION ENDPOINTS ====================
/**
 * GET /api/reservations
 * Returns all reservations
 */
app.get('/api/reservations', (req, res) => {
    res.json(reservations);
});
/**
 * POST /api/reservations
 * Creates a new reservation
 */
app.post('/api/reservations', (req, res) => {
    const { tableNumber, reservationDate, reservationTime } = req.body;
    // Check if table is available
    const table = tables.find(t => t.number === tableNumber);
    if (!table || table.status !== 'available') {
        return res.status(400).json({ error: 'Table is not available for reservation' });
    }
    const reservation = {
        id: `res_${Date.now()}`,
        customerName: req.body.customerName,
        customerEmail: req.body.customerEmail,
        customerPhone: req.body.customerPhone,
        tableNumber: tableNumber,
        reservationDate: reservationDate,
        reservationTime: reservationTime,
        numberOfGuests: req.body.numberOfGuests,
        status: 'confirmed'
    };
    // Basic validation
    if (!reservation.customerName || !reservation.reservationDate || !reservation.reservationTime) {
        return res.status(400).json({ error: 'Missing required fields' });
    }
    // Update table status to reserved
    table.status = 'reserved';
    reservations.push(reservation);
    res.status(201).json(reservation);
});
/**
 * GET /api/reservations/:id
 * Returns a specific reservation by ID
 */
app.get('/api/reservations/:id', (req, res) => {
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
app.get('/api/orders', (req, res) => {
    res.json(orders);
});
/**
 * POST /api/orders
 * Creates a new order
 */
app.post('/api/orders', (req, res) => {
    const { tableNumber, items, assignedWaiter, customerName } = req.body;
    // Check if table exists
    const table = tables.find(t => t.number === tableNumber);
    if (!table) {
        return res.status(400).json({ error: 'Table not found' });
    }
    const order = {
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
app.get('/api/orders/:id', (req, res) => {
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
app.put('/api/orders/:id/status', (req, res) => {
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
app.post('/api/bills/generate', (req, res) => {
    const { orderId } = req.body;
    const order = orders.find(o => o.id === orderId);
    if (!order) {
        return res.status(404).json({ error: 'Order not found' });
    }
    // Calculate totals
    const subtotal = order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const tax = subtotal * 0.1; // 10% tax
    const total = subtotal + tax;
    const bill = {
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
app.post('/api/bills/:id/pay', (req, res) => {
    const { paymentMethod } = req.body;
    // Update order status to paid
    const billId = req.params.id;
    const orderId = billId.replace('bill_', 'order_');
    const order = orders.find(o => o.id === orderId);
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
app.get('/api/waiters/:id/stats', (req, res) => {
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
app.post('/api/auth/login', (req, res) => {
    const { username, password, role } = req.body;
    if (!username || !password || !role) {
        return res.status(400).json({ error: 'Missing required fields' });
    }
    // Check if user exists
    const user = users[username];
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
// ==================== KITCHEN ORDER ENDPOINTS ====================
/**
 * GET /api/kitchen/orders
 * Returns orders in a shape friendly for the kitchen dashboard
 */
// GET all orders for kitchen dashboard
app.get('/api/kitchen/orders', (req, res) => {
    const kitchenOrders = orders.map(order => ({
        ...order,
        items: order.items.map(item => {
            const menuItem = sampleData_1.sampleMenuItems.find(m => m.id === item.menuItemId);
            return {
                ...item,
                name: menuItem ? menuItem.name : 'Unknown Item'
            };
        })
    }));
    res.json(kitchenOrders);
});
/**
 * POST /api/kitchen/orders/:id/accept
 * Chef accepts an order and sets estimated prep time
 */
app.post('/api/kitchen/orders/:id/accept', (req, res) => {
    const order = orders.find(o => o.id === req.params.id);
    if (!order) {
        return res.status(404).json({ error: 'Order not found' });
    }
    const { chefId, chefName, estimatedPrepTime } = req.body;
    if (!estimatedPrepTime || estimatedPrepTime <= 0) {
        return res.status(400).json({ error: 'Invalid estimated preparation time' });
    }
    order.status = 'preparing';
    order.assignedChef = chefId;
    order.chefName = chefName;
    order.estimatedPrepTime = estimatedPrepTime;
    order.startTime = new Date().toISOString();
    order.updatedAt = new Date().toISOString();
    return res.json(order);
});
/**
 * POST /api/kitchen/orders/:id/complete
 * Chef finishes cooking – order becomes READY for the waiter
 */
app.post('/api/kitchen/orders/:id/complete', (req, res) => {
    const order = orders.find(o => o.id === req.params.id);
    if (!order) {
        return res.status(404).json({ error: 'Order not found' });
    }
    order.status = 'ready';
    order.updatedAt = new Date().toISOString();
    return res.json(order);
});
/**
 * POST /api/kitchen/orders/:id/served
 * Marks order as served to the customer (from kitchen point of view)
 */
app.post('/api/kitchen/orders/:id/served', (req, res) => {
    const order = orders.find(o => o.id === req.params.id);
    if (!order) {
        return res.status(404).json({ error: 'Order not found' });
    }
    order.status = 'served';
    order.updatedAt = new Date().toISOString();
    return res.json(order);
});
// Start server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`API endpoints available at http://localhost:${PORT}/api`);
    console.log(`Customer menu: http://localhost:${PORT}/index.html`);
    console.log(`Staff login: http://localhost:${PORT}/login.html`);
});
