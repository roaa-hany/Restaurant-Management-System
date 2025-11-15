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
    const reservation = {
        id: `res_${Date.now()}`,
        customerName: req.body.customerName,
        customerEmail: req.body.customerEmail,
        customerPhone: req.body.customerPhone,
        tableNumber: req.body.tableNumber,
        reservationDate: req.body.reservationDate,
        reservationTime: req.body.reservationTime,
        numberOfGuests: req.body.numberOfGuests,
        status: 'pending'
    };
    // Basic validation
    if (!reservation.customerName || !reservation.reservationDate || !reservation.reservationTime) {
        return res.status(400).json({ error: 'Missing required fields' });
    }
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
    const order = {
        id: `order_${Date.now()}`,
        tableNumber: req.body.tableNumber,
        items: req.body.items,
        status: 'pending',
        createdAt: new Date().toISOString()
    };
    if (!order.tableNumber || !order.items || order.items.length === 0) {
        return res.status(400).json({ error: 'Missing required fields' });
    }
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
 * Processes payment for a bill
 */
app.post('/api/bills/:id/pay', (req, res) => {
    // In a real app, this would update the bill in a database
    // For now, we just return a success response
    res.json({
        success: true,
        message: 'Payment processed successfully',
        billId: req.params.id
    });
});
// ==================== AUTHENTICATION ENDPOINTS ====================
/**
 * Simple user credentials (in production, use a database)
 */
const users = {
    waiter: { username: 'waiter', password: 'waiter123', role: 'waiter' },
    manager: { username: 'manager', password: 'manager123', role: 'manager' }
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
        token: token
    });
});
// Start server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`API endpoints available at http://localhost:${PORT}/api`);
    console.log(`Login page: http://localhost:${PORT}/login.html`);
});
