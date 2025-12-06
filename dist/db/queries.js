"use strict";
/**
 * Database query helper functions
 * Provides typed database operations for all entities
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllMenuItems = getAllMenuItems;
exports.getMenuItemById = getMenuItemById;
exports.createMenuItem = createMenuItem;
exports.updateMenuItem = updateMenuItem;
exports.deleteMenuItem = deleteMenuItem;
exports.getAllTables = getAllTables;
exports.getAvailableTables = getAvailableTables;
exports.getTableById = getTableById;
exports.getTableByNumber = getTableByNumber;
exports.createTable = createTable;
exports.updateTable = updateTable;
exports.deleteTable = deleteTable;
exports.getAllReservations = getAllReservations;
exports.getReservationById = getReservationById;
exports.createReservation = createReservation;
exports.updateReservationStatus = updateReservationStatus;
exports.getConflictingReservations = getConflictingReservations;
exports.getAllOrders = getAllOrders;
exports.getOrderById = getOrderById;
exports.createOrder = createOrder;
exports.updateOrderStatus = updateOrderStatus;
exports.createBill = createBill;
exports.getBillById = getBillById;
exports.updateBillPayment = updateBillPayment;
exports.getAllFeedback = getAllFeedback;
exports.createFeedback = createFeedback;
exports.getStaffByUsername = getStaffByUsername;
exports.getStaffById = getStaffById;
const config_1 = __importDefault(require("./config"));
// ==================== MENU ITEMS ====================
async function getAllMenuItems() {
    const [rows] = await config_1.default.execute('SELECT * FROM menu_items ORDER BY category, name');
    return rows.map((row) => {
        // Handle JSON fields - MySQL returns them as objects or strings
        let ingredients = row.ingredients;
        if (typeof ingredients === 'string') {
            try {
                ingredients = JSON.parse(ingredients);
            }
            catch {
                ingredients = [];
            }
        }
        if (!Array.isArray(ingredients))
            ingredients = [];
        let allergens = row.allergens;
        if (typeof allergens === 'string') {
            try {
                allergens = JSON.parse(allergens);
            }
            catch {
                allergens = [];
            }
        }
        if (!Array.isArray(allergens))
            allergens = [];
        return {
            id: row.id,
            name: row.name,
            description: row.description,
            price: parseFloat(row.price),
            category: row.category,
            imageUrl: row.image_url,
            ingredients: ingredients,
            allergens: allergens,
            available: Boolean(row.available)
        };
    });
}
async function getMenuItemById(id) {
    const [rows] = await config_1.default.execute('SELECT * FROM menu_items WHERE id = ?', [id]);
    if (rows.length === 0)
        return null;
    const row = rows[0];
    // Handle JSON fields
    let ingredients = row.ingredients;
    if (typeof ingredients === 'string') {
        try {
            ingredients = JSON.parse(ingredients);
        }
        catch {
            ingredients = [];
        }
    }
    if (!Array.isArray(ingredients))
        ingredients = [];
    let allergens = row.allergens;
    if (typeof allergens === 'string') {
        try {
            allergens = JSON.parse(allergens);
        }
        catch {
            allergens = [];
        }
    }
    if (!Array.isArray(allergens))
        allergens = [];
    return {
        id: row.id,
        name: row.name,
        description: row.description,
        price: parseFloat(row.price),
        category: row.category,
        imageUrl: row.image_url,
        ingredients: ingredients,
        allergens: allergens,
        available: Boolean(row.available)
    };
}
async function createMenuItem(item) {
    await config_1.default.execute(`INSERT INTO menu_items (id, name, description, price, category, image_url, ingredients, allergens, available)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
        item.id,
        item.name,
        item.description,
        item.price,
        item.category,
        item.imageUrl,
        JSON.stringify(item.ingredients),
        JSON.stringify(item.allergens),
        item.available
    ]);
    return item;
}
async function updateMenuItem(id, item) {
    const updates = [];
    const values = [];
    if (item.name) {
        updates.push('name = ?');
        values.push(item.name);
    }
    if (item.description !== undefined) {
        updates.push('description = ?');
        values.push(item.description);
    }
    if (item.price !== undefined) {
        updates.push('price = ?');
        values.push(item.price);
    }
    if (item.category) {
        updates.push('category = ?');
        values.push(item.category);
    }
    if (item.imageUrl !== undefined) {
        updates.push('image_url = ?');
        values.push(item.imageUrl);
    }
    if (item.ingredients) {
        updates.push('ingredients = ?');
        values.push(JSON.stringify(item.ingredients));
    }
    if (item.allergens) {
        updates.push('allergens = ?');
        values.push(JSON.stringify(item.allergens));
    }
    if (item.available !== undefined) {
        updates.push('available = ?');
        values.push(item.available);
    }
    if (updates.length === 0)
        return getMenuItemById(id);
    values.push(id);
    await config_1.default.execute(`UPDATE menu_items SET ${updates.join(', ')} WHERE id = ?`, values);
    return getMenuItemById(id);
}
async function deleteMenuItem(id) {
    const [result] = await config_1.default.execute('DELETE FROM menu_items WHERE id = ?', [id]);
    return (result.affectedRows || 0) > 0;
}
// ==================== TABLES ====================
async function getAllTables() {
    const [rows] = await config_1.default.execute('SELECT * FROM tables ORDER BY number');
    return rows.map((row) => ({
        id: row.id,
        number: row.number,
        capacity: row.capacity,
        status: row.status,
        assignedWaiter: row.assigned_waiter || undefined,
        currentOrder: row.current_order || undefined,
        location: row.location || undefined
    }));
}
async function getAvailableTables() {
    const [rows] = await config_1.default.execute('SELECT * FROM tables WHERE status = ? ORDER BY number', ['available']);
    return rows.map((row) => ({
        id: row.id,
        number: row.number,
        capacity: row.capacity,
        status: row.status,
        assignedWaiter: row.assigned_waiter || undefined,
        currentOrder: row.current_order || undefined,
        location: row.location || undefined
    }));
}
async function getTableById(id) {
    const [rows] = await config_1.default.execute('SELECT * FROM tables WHERE id = ?', [id]);
    if (rows.length === 0)
        return null;
    const row = rows[0];
    return {
        id: row.id,
        number: row.number,
        capacity: row.capacity,
        status: row.status,
        assignedWaiter: row.assigned_waiter || undefined,
        currentOrder: row.current_order || undefined,
        location: row.location || undefined
    };
}
async function getTableByNumber(number) {
    const [rows] = await config_1.default.execute('SELECT * FROM tables WHERE number = ?', [number]);
    if (rows.length === 0)
        return null;
    const row = rows[0];
    return {
        id: row.id,
        number: row.number,
        capacity: row.capacity,
        status: row.status,
        assignedWaiter: row.assigned_waiter || undefined,
        currentOrder: row.current_order || undefined,
        location: row.location || undefined
    };
}
async function createTable(table) {
    await config_1.default.execute(`INSERT INTO tables (id, number, capacity, status, location)
     VALUES (?, ?, ?, ?, ?)`, [table.id, table.number, table.capacity, table.status, table.location || null]);
    return table;
}
async function updateTable(id, updates) {
    const updateFields = [];
    const values = [];
    if (updates.number !== undefined) {
        updateFields.push('number = ?');
        values.push(updates.number);
    }
    if (updates.capacity !== undefined) {
        updateFields.push('capacity = ?');
        values.push(updates.capacity);
    }
    if (updates.status) {
        updateFields.push('status = ?');
        values.push(updates.status);
    }
    if (updates.location !== undefined) {
        updateFields.push('location = ?');
        values.push(updates.location);
    }
    if (updates.assignedWaiter !== undefined) {
        updateFields.push('assigned_waiter = ?');
        values.push(updates.assignedWaiter || null);
    }
    if (updates.currentOrder !== undefined) {
        updateFields.push('current_order = ?');
        values.push(updates.currentOrder || null);
    }
    if (updateFields.length === 0)
        return getTableById(id);
    values.push(id);
    await config_1.default.execute(`UPDATE tables SET ${updateFields.join(', ')} WHERE id = ?`, values);
    return getTableById(id);
}
async function deleteTable(id) {
    const [result] = await config_1.default.execute('DELETE FROM tables WHERE id = ?', [id]);
    return (result.affectedRows || 0) > 0;
}
// ==================== RESERVATIONS ====================
async function getAllReservations() {
    const [rows] = await config_1.default.execute('SELECT * FROM reservations ORDER BY reservation_date, reservation_time');
    return rows.map(convertReservationRow);
}
async function getReservationById(id) {
    const [rows] = await config_1.default.execute('SELECT * FROM reservations WHERE id = ?', [id]);
    if (rows.length === 0)
        return null;
    return convertReservationRow(rows[0]);
}
async function createReservation(reservation) {
    await config_1.default.execute(`INSERT INTO reservations (id, customer_name, customer_email, customer_phone, table_number,
      reservation_date, reservation_time, end_time, number_of_guests, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
        reservation.id,
        reservation.customerName,
        reservation.customerEmail,
        reservation.customerPhone,
        reservation.tableNumber,
        reservation.reservationDate,
        reservation.reservationTime,
        reservation.endTime,
        reservation.numberOfGuests,
        reservation.status
    ]);
    return reservation;
}
async function updateReservationStatus(id, status) {
    await config_1.default.execute('UPDATE reservations SET status = ? WHERE id = ?', [status, id]);
    return getReservationById(id);
}
function convertReservationRow(row) {
    return {
        id: row.id,
        customerName: row.customer_name,
        customerEmail: row.customer_email,
        customerPhone: row.customer_phone,
        tableNumber: row.table_number,
        reservationDate: row.reservation_date,
        reservationTime: row.reservation_time,
        endTime: row.end_time,
        numberOfGuests: row.number_of_guests,
        status: row.status
    };
}
async function getConflictingReservations(tableNumber, date, startTime, endTime, excludeId) {
    let sql = `
    SELECT * FROM reservations 
    WHERE table_number = ? 
      AND reservation_date = ?
      AND status != 'cancelled'
      AND (
        (reservation_time < ? AND end_time > ?) OR
        (reservation_time < ? AND end_time > ?) OR
        (reservation_time >= ? AND end_time <= ?)
      )
  `;
    const params = [tableNumber, date, endTime, startTime, endTime, startTime, startTime, endTime];
    if (excludeId) {
        sql += ' AND id != ?';
        params.push(excludeId);
    }
    const [rows] = await config_1.default.execute(sql, params);
    return rows.map(convertReservationRow);
}
// ==================== ORDERS ====================
async function getAllOrders(statusFilter) {
    let sql = 'SELECT * FROM orders';
    const params = [];
    if (statusFilter && statusFilter.length > 0) {
        sql += ' WHERE status IN (' + statusFilter.map(() => '?').join(',') + ')';
        params.push(...statusFilter);
    }
    sql += ' ORDER BY created_at DESC';
    const [orderRows] = await config_1.default.execute(sql, params);
    const orders = [];
    for (const row of orderRows) {
        const [itemRows] = await config_1.default.execute('SELECT * FROM order_items WHERE order_id = ?', [row.id]);
        const items = itemRows.map((itemRow) => ({
            menuItemId: itemRow.menu_item_id,
            quantity: itemRow.quantity,
            price: parseFloat(itemRow.price),
            notes: itemRow.notes || undefined,
            id: itemRow.id?.toString()
        }));
        orders.push({
            id: row.id,
            tableNumber: row.table_number,
            items,
            status: row.status,
            createdAt: row.created_at,
            assignedWaiter: row.assigned_waiter || undefined,
            customerName: row.customer_name || undefined
        });
    }
    return orders;
}
async function getOrderById(id) {
    const [rows] = await config_1.default.execute('SELECT * FROM orders WHERE id = ?', [id]);
    if (rows.length === 0)
        return null;
    const row = rows[0];
    const [itemRows] = await config_1.default.execute('SELECT * FROM order_items WHERE order_id = ?', [id]);
    const items = itemRows.map((itemRow) => ({
        menuItemId: itemRow.menu_item_id,
        quantity: itemRow.quantity,
        price: parseFloat(itemRow.price),
        notes: itemRow.notes || undefined,
        id: itemRow.id?.toString()
    }));
    return {
        id: row.id,
        tableNumber: row.table_number,
        items,
        status: row.status,
        createdAt: row.created_at,
        assignedWaiter: row.assigned_waiter || undefined,
        customerName: row.customer_name || undefined
    };
}
async function createOrder(order) {
    const connection = await config_1.default.getConnection();
    try {
        await connection.beginTransaction();
        // Insert order
        await connection.execute(`INSERT INTO orders (id, table_number, status, assigned_waiter, customer_name)
       VALUES (?, ?, ?, ?, ?)`, [
            order.id,
            order.tableNumber,
            order.status,
            order.assignedWaiter || null,
            order.customerName || null
        ]);
        // Insert order items
        for (const item of order.items) {
            await connection.execute(`INSERT INTO order_items (order_id, menu_item_id, quantity, price, notes)
         VALUES (?, ?, ?, ?, ?)`, [
                order.id,
                item.menuItemId,
                item.quantity,
                item.price,
                item.notes || null
            ]);
        }
        await connection.commit();
        return order;
    }
    catch (error) {
        await connection.rollback();
        throw error;
    }
    finally {
        connection.release();
    }
}
async function updateOrderStatus(id, status, updates) {
    const updateFields = ['status = ?'];
    const values = [status];
    if (updates) {
        if (updates.assignedChef) {
            updateFields.push('assigned_chef = ?');
            values.push(updates.assignedChef);
        }
        if (updates.chefName) {
            updateFields.push('chef_name = ?');
            values.push(updates.chefName);
        }
        if (updates.estimatedPrepTime) {
            updateFields.push('estimated_prep_time = ?');
            values.push(updates.estimatedPrepTime);
        }
        if (updates.startTime) {
            // Convert ISO datetime string to MySQL datetime format (YYYY-MM-DD HH:MM:SS)
            let mysqlDateTime;
            if (typeof updates.startTime === 'string') {
                // Handle ISO format: 2025-12-06T14:27:29.816Z
                const date = new Date(updates.startTime);
                if (isNaN(date.getTime())) {
                    // Invalid date, skip
                    console.warn('Invalid startTime format:', updates.startTime);
                }
                else {
                    // Format as MySQL datetime: YYYY-MM-DD HH:MM:SS
                    mysqlDateTime = date.toISOString().slice(0, 19).replace('T', ' ');
                    updateFields.push('start_time = ?');
                    values.push(mysqlDateTime);
                }
            }
            else {
                // Already in correct format or Date object
                updateFields.push('start_time = ?');
                values.push(updates.startTime);
            }
        }
    }
    values.push(id);
    await config_1.default.execute(`UPDATE orders SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`, values);
    return getOrderById(id);
}
// ==================== BILLS ====================
async function createBill(bill) {
    await config_1.default.execute(`INSERT INTO bills (id, order_id, table_number, subtotal, tax, total, payment_method, payment_status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, [
        bill.id,
        bill.orderId,
        bill.tableNumber,
        bill.subtotal,
        bill.tax,
        bill.total,
        bill.paymentMethod,
        bill.paymentStatus
    ]);
    return bill;
}
async function getBillById(id) {
    const [rows] = await config_1.default.execute('SELECT * FROM bills WHERE id = ?', [id]);
    if (rows.length === 0)
        return null;
    const row = rows[0];
    // Get order items for the bill
    const order = await getOrderById(row.order_id);
    return {
        id: row.id,
        orderId: row.order_id,
        tableNumber: row.table_number,
        items: order?.items || [],
        subtotal: parseFloat(row.subtotal),
        tax: parseFloat(row.tax),
        total: parseFloat(row.total),
        paymentMethod: row.payment_method,
        paymentStatus: row.payment_status,
        createdAt: row.created_at
    };
}
async function updateBillPayment(id, paymentMethod) {
    await config_1.default.execute('UPDATE bills SET payment_method = ?, payment_status = ? WHERE id = ?', [paymentMethod, 'paid', id]);
    return getBillById(id);
}
// ==================== FEEDBACK ====================
async function getAllFeedback() {
    const [rows] = await config_1.default.execute('SELECT * FROM feedback ORDER BY created_at DESC');
    return rows.map((row) => ({
        id: row.id,
        customerName: row.customer_name,
        customerEmail: row.customer_email,
        rating: row.rating,
        comment: row.comment,
        createdAt: row.created_at,
        status: row.status || 'pending'
    }));
}
async function createFeedback(feedback) {
    await config_1.default.execute(`INSERT INTO feedback (id, customer_name, customer_email, rating, comment, status)
     VALUES (?, ?, ?, ?, ?, ?)`, [
        feedback.id,
        feedback.customerName,
        feedback.customerEmail,
        feedback.rating,
        feedback.comment,
        feedback.status || 'pending'
    ]);
    return feedback;
}
// ==================== STAFF ====================
async function getStaffByUsername(username) {
    const [rows] = await config_1.default.execute('SELECT * FROM staff WHERE username = ?', [username]);
    if (rows.length === 0)
        return null;
    return {
        id: rows[0].id,
        username: rows[0].username,
        password: rows[0].password,
        role: rows[0].role,
        name: rows[0].name
    };
}
async function getStaffById(id) {
    const [rows] = await config_1.default.execute('SELECT * FROM staff WHERE id = ?', [id]);
    if (rows.length === 0)
        return null;
    return {
        id: rows[0].id,
        username: rows[0].username,
        password: rows[0].password,
        role: rows[0].role,
        name: rows[0].name
    };
}
