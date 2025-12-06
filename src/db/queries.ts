/**
 * Database query helper functions
 * Provides typed database operations for all entities
 */

import pool from './config';
import { MenuItem, Reservation, Order, Bill, Table, OrderItem, Feedback } from '../types';

// ==================== MENU ITEMS ====================
export async function getAllMenuItems(): Promise<MenuItem[]> {
  const [rows] = await pool.execute<any[]>(
    'SELECT * FROM menu_items ORDER BY category, name'
  );
  return (rows as any[]).map((row: any) => {
    // Handle JSON fields - MySQL returns them as objects or strings
    let ingredients = row.ingredients;
    if (typeof ingredients === 'string') {
      try {
        ingredients = JSON.parse(ingredients);
      } catch {
        ingredients = [];
      }
    }
    if (!Array.isArray(ingredients)) ingredients = [];
    
    let allergens = row.allergens;
    if (typeof allergens === 'string') {
      try {
        allergens = JSON.parse(allergens);
      } catch {
        allergens = [];
      }
    }
    if (!Array.isArray(allergens)) allergens = [];
    
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

export async function getMenuItemById(id: string): Promise<MenuItem | null> {
  const [rows] = await pool.execute<any[]>(
    'SELECT * FROM menu_items WHERE id = ?',
    [id]
  );
  if (rows.length === 0) return null;
  const row = rows[0];
  
  // Handle JSON fields
  let ingredients = row.ingredients;
  if (typeof ingredients === 'string') {
    try {
      ingredients = JSON.parse(ingredients);
    } catch {
      ingredients = [];
    }
  }
  if (!Array.isArray(ingredients)) ingredients = [];
  
  let allergens = row.allergens;
  if (typeof allergens === 'string') {
    try {
      allergens = JSON.parse(allergens);
    } catch {
      allergens = [];
    }
  }
  if (!Array.isArray(allergens)) allergens = [];
  
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

export async function createMenuItem(item: MenuItem): Promise<MenuItem> {
  await pool.execute(
    `INSERT INTO menu_items (id, name, description, price, category, image_url, ingredients, allergens, available)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      item.id,
      item.name,
      item.description,
      item.price,
      item.category,
      item.imageUrl,
      JSON.stringify(item.ingredients),
      JSON.stringify(item.allergens),
      item.available
    ]
  );
  return item;
}

export async function updateMenuItem(id: string, item: Partial<MenuItem>): Promise<MenuItem | null> {
  const updates: string[] = [];
  const values: any[] = [];
  
  if (item.name) { updates.push('name = ?'); values.push(item.name); }
  if (item.description !== undefined) { updates.push('description = ?'); values.push(item.description); }
  if (item.price !== undefined) { updates.push('price = ?'); values.push(item.price); }
  if (item.category) { updates.push('category = ?'); values.push(item.category); }
  if (item.imageUrl !== undefined) { updates.push('image_url = ?'); values.push(item.imageUrl); }
  if (item.ingredients) { updates.push('ingredients = ?'); values.push(JSON.stringify(item.ingredients)); }
  if (item.allergens) { updates.push('allergens = ?'); values.push(JSON.stringify(item.allergens)); }
  if (item.available !== undefined) { updates.push('available = ?'); values.push(item.available); }
  
  if (updates.length === 0) return getMenuItemById(id);
  
  values.push(id);
  await pool.execute(
    `UPDATE menu_items SET ${updates.join(', ')} WHERE id = ?`,
    values
  );
  return getMenuItemById(id);
}

export async function deleteMenuItem(id: string): Promise<boolean> {
  const [result] = await pool.execute<any>('DELETE FROM menu_items WHERE id = ?', [id]);
  return (result.affectedRows || 0) > 0;
}

// ==================== TABLES ====================
export async function getAllTables(): Promise<Table[]> {
  const [rows] = await pool.execute<any[]>('SELECT * FROM tables ORDER BY number');
  return (rows as any[]).map((row: any) => ({
    id: row.id,
    number: row.number,
    capacity: row.capacity,
    status: row.status,
    assignedWaiter: row.assigned_waiter || undefined,
    currentOrder: row.current_order || undefined,
    location: row.location || undefined
  }));
}

export async function getAvailableTables(): Promise<Table[]> {
  const [rows] = await pool.execute<any[]>(
    'SELECT * FROM tables WHERE status = ? ORDER BY number',
    ['available']
  );
  return (rows as any[]).map((row: any) => ({
    id: row.id,
    number: row.number,
    capacity: row.capacity,
    status: row.status,
    assignedWaiter: row.assigned_waiter || undefined,
    currentOrder: row.current_order || undefined,
    location: row.location || undefined
  }));
}

export async function getTableById(id: string): Promise<Table | null> {
  const [rows] = await pool.execute<any[]>(
    'SELECT * FROM tables WHERE id = ?',
    [id]
  );
  if (rows.length === 0) return null;
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

export async function getTableByNumber(number: number): Promise<Table | null> {
  const [rows] = await pool.execute<any[]>(
    'SELECT * FROM tables WHERE number = ?',
    [number]
  );
  if (rows.length === 0) return null;
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

export async function createTable(table: Table): Promise<Table> {
  await pool.execute(
    `INSERT INTO tables (id, number, capacity, status, location)
     VALUES (?, ?, ?, ?, ?)`,
    [table.id, table.number, table.capacity, table.status, table.location || null]
  );
  return table;
}

export async function updateTable(id: string, updates: Partial<Table>): Promise<Table | null> {
  const updateFields: string[] = [];
  const values: any[] = [];
  
  if (updates.number !== undefined) { updateFields.push('number = ?'); values.push(updates.number); }
  if (updates.capacity !== undefined) { updateFields.push('capacity = ?'); values.push(updates.capacity); }
  if (updates.status) { updateFields.push('status = ?'); values.push(updates.status); }
  if (updates.location !== undefined) { updateFields.push('location = ?'); values.push(updates.location); }
  if (updates.assignedWaiter !== undefined) { updateFields.push('assigned_waiter = ?'); values.push(updates.assignedWaiter || null); }
  if (updates.currentOrder !== undefined) { updateFields.push('current_order = ?'); values.push(updates.currentOrder || null); }
  
  if (updateFields.length === 0) return getTableById(id);
  
  values.push(id);
  await pool.execute(
    `UPDATE tables SET ${updateFields.join(', ')} WHERE id = ?`,
    values
  );
  return getTableById(id);
}

export async function deleteTable(id: string): Promise<boolean> {
  const [result] = await pool.execute<any>('DELETE FROM tables WHERE id = ?', [id]);
  return (result.affectedRows || 0) > 0;
}

// ==================== RESERVATIONS ====================
export async function getAllReservations(): Promise<Reservation[]> {
  const [rows] = await pool.execute<any[]>(
    'SELECT * FROM reservations ORDER BY reservation_date, reservation_time'
  );
  return rows.map(convertReservationRow);
}

export async function getReservationById(id: string): Promise<Reservation | null> {
  const [rows] = await pool.execute<any[]>(
    'SELECT * FROM reservations WHERE id = ?',
    [id]
  );
  if (rows.length === 0) return null;
  return convertReservationRow(rows[0]);
}

export async function createReservation(reservation: Reservation): Promise<Reservation> {
  await pool.execute(
    `INSERT INTO reservations (id, customer_name, customer_email, customer_phone, table_number,
      reservation_date, reservation_time, end_time, number_of_guests, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
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
    ]
  );
  return reservation;
}

export async function updateReservationStatus(id: string, status: 'pending' | 'confirmed' | 'cancelled'): Promise<Reservation | null> {
  await pool.execute(
    'UPDATE reservations SET status = ? WHERE id = ?',
    [status, id]
  );
  return getReservationById(id);
}

function convertReservationRow(row: any): Reservation {
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

export async function getConflictingReservations(
  tableNumber: number,
  date: string,
  startTime: string,
  endTime: string,
  excludeId?: string
): Promise<Reservation[]> {
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
  const params: any[] = [tableNumber, date, endTime, startTime, endTime, startTime, startTime, endTime];
  
  if (excludeId) {
    sql += ' AND id != ?';
    params.push(excludeId);
  }
  
  const [rows] = await pool.execute<any[]>(sql, params);
  return rows.map(convertReservationRow);
}

// ==================== ORDERS ====================
export async function getAllOrders(statusFilter?: string[]): Promise<Order[]> {
  let sql = 'SELECT * FROM orders';
  const params: any[] = [];
  
  if (statusFilter && statusFilter.length > 0) {
    sql += ' WHERE status IN (' + statusFilter.map(() => '?').join(',') + ')';
    params.push(...statusFilter);
  }
  
  sql += ' ORDER BY created_at DESC';
  
  const [orderRows] = await pool.execute<any[]>(sql, params);
  const orders: Order[] = [];
  
  for (const row of orderRows) {
    const [itemRows] = await pool.execute<any[]>(
      'SELECT * FROM order_items WHERE order_id = ?',
      [row.id]
    );
    
    const items: OrderItem[] = (itemRows as any[]).map((itemRow: any) => ({
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

export async function getOrderById(id: string): Promise<Order | null> {
  const [rows] = await pool.execute<any[]>(
    'SELECT * FROM orders WHERE id = ?',
    [id]
  );
  if (rows.length === 0) return null;
  
  const row = rows[0];
  const [itemRows] = await pool.execute<any[]>(
    'SELECT * FROM order_items WHERE order_id = ?',
    [id]
  );
  
  const items: OrderItem[] = (itemRows as any[]).map((itemRow: any) => ({
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

export async function createOrder(order: Order): Promise<Order> {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    
    // Insert order
    await connection.execute(
      `INSERT INTO orders (id, table_number, status, assigned_waiter, customer_name)
       VALUES (?, ?, ?, ?, ?)`,
      [
        order.id,
        order.tableNumber,
        order.status,
        order.assignedWaiter || null,
        order.customerName || null
      ]
    );
    
    // Insert order items
    for (const item of order.items) {
      await connection.execute(
        `INSERT INTO order_items (order_id, menu_item_id, quantity, price, notes)
         VALUES (?, ?, ?, ?, ?)`,
        [
          order.id,
          item.menuItemId,
          item.quantity,
          item.price,
          item.notes || null
        ]
      );
    }
    
    await connection.commit();
    return order;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function updateOrderStatus(id: string, status: string, updates?: any): Promise<Order | null> {
  const updateFields: string[] = ['status = ?'];
  const values: any[] = [status];
  
  if (updates) {
    if (updates.assignedChef) { updateFields.push('assigned_chef = ?'); values.push(updates.assignedChef); }
    if (updates.chefName) { updateFields.push('chef_name = ?'); values.push(updates.chefName); }
    if (updates.estimatedPrepTime) { updateFields.push('estimated_prep_time = ?'); values.push(updates.estimatedPrepTime); }
    if (updates.startTime) {
      // Convert ISO datetime string to MySQL datetime format (YYYY-MM-DD HH:MM:SS)
      let mysqlDateTime: string;
      if (typeof updates.startTime === 'string') {
        // Handle ISO format: 2025-12-06T14:27:29.816Z
        const date = new Date(updates.startTime);
        if (isNaN(date.getTime())) {
          // Invalid date, skip
          console.warn('Invalid startTime format:', updates.startTime);
        } else {
          // Format as MySQL datetime: YYYY-MM-DD HH:MM:SS
          mysqlDateTime = date.toISOString().slice(0, 19).replace('T', ' ');
          updateFields.push('start_time = ?');
          values.push(mysqlDateTime);
        }
      } else {
        // Already in correct format or Date object
        updateFields.push('start_time = ?');
        values.push(updates.startTime);
      }
    }
  }
  
  values.push(id);
  await pool.execute(
    `UPDATE orders SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
    values
  );
  return getOrderById(id);
}

// ==================== BILLS ====================
export async function createBill(bill: Bill): Promise<Bill> {
  await pool.execute(
    `INSERT INTO bills (id, order_id, table_number, subtotal, tax, total, payment_method, payment_status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      bill.id,
      bill.orderId,
      bill.tableNumber,
      bill.subtotal,
      bill.tax,
      bill.total,
      bill.paymentMethod,
      bill.paymentStatus
    ]
  );
  return bill;
}

export async function getBillById(id: string): Promise<Bill | null> {
  const [rows] = await pool.execute<any[]>(
    'SELECT * FROM bills WHERE id = ?',
    [id]
  );
  if (rows.length === 0) return null;
  
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

export async function updateBillPayment(id: string, paymentMethod: string): Promise<Bill | null> {
  await pool.execute(
    'UPDATE bills SET payment_method = ?, payment_status = ? WHERE id = ?',
    [paymentMethod, 'paid', id]
  );
  return getBillById(id);
}

// ==================== FEEDBACK ====================
export async function getAllFeedback(): Promise<Feedback[]> {
  const [rows] = await pool.execute<any[]>(
    'SELECT * FROM feedback ORDER BY created_at DESC'
  );
  return (rows as any[]).map((row: any) => ({
    id: row.id,
    customerName: row.customer_name,
    customerEmail: row.customer_email,
    rating: row.rating,
    comment: row.comment,
    createdAt: row.created_at,
    status: row.status || 'pending'
  }));
}

export async function createFeedback(feedback: Feedback): Promise<Feedback> {
  await pool.execute(
    `INSERT INTO feedback (id, customer_name, customer_email, rating, comment, status)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      feedback.id,
      feedback.customerName,
      feedback.customerEmail,
      feedback.rating,
      feedback.comment,
      feedback.status || 'pending'
    ]
  );
  return feedback;
}

// ==================== STAFF ====================
export async function getStaffByUsername(username: string): Promise<any | null> {
  const [rows] = await pool.execute<any[]>(
    'SELECT * FROM staff WHERE username = ?',
    [username]
  );
  if (rows.length === 0) return null;
  return {
    id: rows[0].id,
    username: rows[0].username,
    password: rows[0].password,
    role: rows[0].role,
    name: rows[0].name
  };
}

export async function getStaffById(id: string): Promise<any | null> {
  const [rows] = await pool.execute<any[]>(
    'SELECT * FROM staff WHERE id = ?',
    [id]
  );
  if (rows.length === 0) return null;
  return {
    id: rows[0].id,
    username: rows[0].username,
    password: rows[0].password,
    role: rows[0].role,
    name: rows[0].name
  };
}

