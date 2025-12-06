/**
 * Fix seed data - inserts staff and tables
 */

require('dotenv').config();
const mysql = require('mysql2/promise');

async function fixSeed() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: (process.env.DB_PASSWORD || '').replace(/^["']|["']$/g, ''),
    database: process.env.DB_NAME || 'restaurant_db'
  });

  try {
    // Insert staff
    await pool.execute(`
      INSERT INTO staff (id, username, password, role, name) 
      VALUES 
        ('waiter1', 'waiter', 'waiter123', 'waiter', 'Ahmed Waiter'),
        ('manager1', 'manager', 'manager123', 'manager', 'Manager'),
        ('chef1', 'chef1', 'chef123', 'chef', 'Chef')
      ON DUPLICATE KEY UPDATE username=username
    `);
    console.log('✓ Staff inserted');

    // Insert tables
    await pool.execute(`
      INSERT INTO tables (id, number, capacity, status, location) 
      VALUES 
        ('table_1', 1, 2, 'available', 'Window'),
        ('table_2', 2, 4, 'available', 'Window'),
        ('table_3', 3, 4, 'available', 'Center'),
        ('table_4', 4, 6, 'available', 'Center'),
        ('table_5', 5, 2, 'available', 'Corner'),
        ('table_6', 6, 4, 'available', 'Window'),
        ('table_7', 7, 8, 'available', 'Private Area'),
        ('table_8', 8, 4, 'available', 'Center'),
        ('table_9', 9, 2, 'available', 'Window'),
        ('table_10', 10, 6, 'available', 'Center')
      ON DUPLICATE KEY UPDATE number=number
    `);
    console.log('✓ Tables inserted');

    // Verify
    const [menuCount] = await pool.execute('SELECT COUNT(*) as count FROM menu_items');
    const [tableCount] = await pool.execute('SELECT COUNT(*) as count FROM tables');
    const [staffCount] = await pool.execute('SELECT COUNT(*) as count FROM staff');

    console.log('\n✓ Database ready:');
    console.log(`  Menu items: ${menuCount[0].count}`);
    console.log(`  Tables: ${tableCount[0].count}`);
    console.log(`  Staff: ${staffCount[0].count}`);
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

fixSeed();

