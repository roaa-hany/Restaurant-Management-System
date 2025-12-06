/**
 * Manual database seeding script
 * Run this if automatic seeding didn't work: node scripts/seed-database.js
 */

require('dotenv').config();
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function seedDatabase() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: (process.env.DB_PASSWORD || '').replace(/^["']|["']$/g, ''),
    database: process.env.DB_NAME || 'restaurant_db'
  });

  try {
    console.log('Reading seed file...');
    const seedPath = path.join(__dirname, '../database/seed.sql');
    const seedSQL = fs.readFileSync(seedPath, 'utf-8');
    
    // Remove USE and comments
    let cleanSQL = seedSQL
      .replace(/USE[^;]*;/gi, '')
      .replace(/--.*$/gm, '')
      .replace(/\/\*[\s\S]*?\*\//g, '');
    
    // Split by semicolon
    const statements = cleanSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);
    
    console.log(`Found ${statements.length} statements to execute`);
    
    let success = 0;
    let errors = 0;
    
    for (const statement of statements) {
      if (statement.length > 10) {
        try {
          await pool.execute(statement);
          success++;
        } catch (error) {
          if (error.message.includes('Duplicate entry')) {
            // Ignore duplicates
          } else {
            console.error(`Error: ${error.message}`);
            console.error(`Statement: ${statement.substring(0, 100)}...`);
            errors++;
          }
        }
      }
    }
    
    console.log(`\n✓ Seeding complete: ${success} successful, ${errors} errors`);
    
    // Verify
    const [menuCount] = await pool.execute('SELECT COUNT(*) as count FROM menu_items');
    const [tableCount] = await pool.execute('SELECT COUNT(*) as count FROM tables');
    const [staffCount] = await pool.execute('SELECT COUNT(*) as count FROM staff');
    
    console.log(`\nDatabase contents:`);
    console.log(`  Menu items: ${menuCount[0].count}`);
    console.log(`  Tables: ${tableCount[0].count}`);
    console.log(`  Staff: ${staffCount[0].count}`);
    
  } catch (error) {
    console.error('Fatal error:', error);
  } finally {
    await pool.end();
  }
}

seedDatabase();

