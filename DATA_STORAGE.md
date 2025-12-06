# Data Storage Documentation

## Current Implementation (In-Memory Storage)

### Overview
The Restaurant Management System currently uses **in-memory storage** for all dynamic data. This means all data is stored in server RAM and is lost when the server restarts.

### Data Storage Locations

| Data Type | Storage Location | Persistence | Notes |
|-----------|-----------------|-------------|-------|
| Menu Items | `src/data/sampleData.ts` (hardcoded) | ✅ Permanent (until code change) | Initialized on server start |
| Reservations | Server memory (`reservations` array in `src/server.ts`) | ❌ Lost on restart | Modified via API endpoints |
| Orders | Server memory (`orders` array in `src/server.ts`) | ❌ Lost on restart | Modified via API endpoints |
| Tables | Server memory (`tables` array in `src/server.ts`) | ❌ Lost on restart | Modified via API endpoints |
| Bills | Generated on-demand, not stored | ❌ Not persisted | Generated from orders when needed |
| User Sessions | Client-side (`localStorage`) | ⚠️ Client-side only | Cleared when browser data is cleared |

### Technical Implementation

All data is stored in arrays in `src/server.ts`:

```typescript
let menuItems: MenuItem[] = [...sampleMenuItems];
let reservations: Reservation[] = [...sampleReservations];
let orders: Order[] = [...sampleOrders];
let tables: Table[] = [...sampleTables];
```

### Limitations

1. **No Data Persistence**: All data is lost when the server restarts
2. **No Concurrency Control**: Multiple users can cause race conditions
3. **No Data Integrity**: No foreign key constraints or validation rules
4. **Scalability Issues**: In-memory storage doesn't scale across multiple servers
5. **No Backup/Recovery**: No way to backup or restore data

---

## Migrating to SQL Database

### Why Migrate to SQL?

Migrating to a SQL database provides:
- ✅ **Persistent Data**: Data survives server restarts
- ✅ **Data Integrity**: Foreign keys, constraints, and transactions
- ✅ **Better Performance**: Indexed queries for faster access
- ✅ **Scalability**: Can handle larger datasets efficiently
- ✅ **Backup & Recovery**: Standard database backup tools
- ✅ **Concurrency**: Built-in transaction handling

### Recommended Database: SQLite (Development) or PostgreSQL (Production)

- **SQLite**: Perfect for development and small deployments (file-based, no server needed)
- **PostgreSQL**: Recommended for production (robust, feature-rich, enterprise-grade)

---

## Database Schema Design

### Table 1: `menu_items`

Stores menu items with ingredients and allergens.

```sql
CREATE TABLE menu_items (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    category VARCHAR(50) NOT NULL CHECK (category IN ('appetizer', 'main', 'dessert', 'beverage')),
    image_url TEXT,
    available BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_menu_items_category ON menu_items(category);
CREATE INDEX idx_menu_items_available ON menu_items(available);
```

### Table 2: `menu_item_ingredients`

Stores ingredients for each menu item (many-to-many relationship).

```sql
CREATE TABLE menu_item_ingredients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    menu_item_id VARCHAR(50) NOT NULL,
    ingredient VARCHAR(255) NOT NULL,
    FOREIGN KEY (menu_item_id) REFERENCES menu_items(id) ON DELETE CASCADE
);

CREATE INDEX idx_ingredients_menu_item ON menu_item_ingredients(menu_item_id);
```

### Table 3: `menu_item_allergens`

Stores allergens for each menu item (many-to-many relationship).

```sql
CREATE TABLE menu_item_allergens (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    menu_item_id VARCHAR(50) NOT NULL,
    allergen VARCHAR(255) NOT NULL,
    FOREIGN KEY (menu_item_id) REFERENCES menu_items(id) ON DELETE CASCADE
);

CREATE INDEX idx_allergens_menu_item ON menu_item_allergens(menu_item_id);
```

### Table 4: `tables`

Stores restaurant table information.

```sql
CREATE TABLE tables (
    id VARCHAR(50) PRIMARY KEY,
    number INTEGER NOT NULL UNIQUE,
    capacity INTEGER NOT NULL CHECK (capacity > 0),
    status VARCHAR(50) NOT NULL DEFAULT 'available' 
        CHECK (status IN ('available', 'occupied', 'reserved', 'need-assistance', 'maintenance')),
    assigned_waiter VARCHAR(50),
    current_order VARCHAR(50),
    location VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_tables_status ON tables(status);
CREATE INDEX idx_tables_number ON tables(number);
CREATE INDEX idx_tables_assigned_waiter ON tables(assigned_waiter);
```

### Table 5: `reservations`

Stores table reservations with time ranges.

```sql
CREATE TABLE reservations (
    id VARCHAR(50) PRIMARY KEY,
    customer_name VARCHAR(255) NOT NULL,
    customer_email VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(50) NOT NULL,
    table_number INTEGER NOT NULL,
    reservation_date DATE NOT NULL,
    reservation_time TIME NOT NULL,
    end_time TIME NOT NULL,
    number_of_guests INTEGER NOT NULL CHECK (number_of_guests > 0),
    status VARCHAR(50) NOT NULL DEFAULT 'pending' 
        CHECK (status IN ('pending', 'confirmed', 'cancelled')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (table_number) REFERENCES tables(number)
);

CREATE INDEX idx_reservations_date ON reservations(reservation_date);
CREATE INDEX idx_reservations_table_date ON reservations(table_number, reservation_date);
CREATE INDEX idx_reservations_status ON reservations(status);
```

### Table 6: `orders`

Stores customer orders.

```sql
CREATE TABLE orders (
    id VARCHAR(50) PRIMARY KEY,
    table_number INTEGER NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending' 
        CHECK (status IN ('pending', 'preparing', 'ready', 'completed', 'served', 'paid')),
    assigned_waiter VARCHAR(50),
    assigned_chef VARCHAR(50),
    chef_name VARCHAR(255),
    customer_name VARCHAR(255),
    estimated_prep_time INTEGER, -- in minutes
    start_time TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (table_number) REFERENCES tables(number)
);

CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_table ON orders(table_number);
CREATE INDEX idx_orders_waiter ON orders(assigned_waiter);
CREATE INDEX idx_orders_created_at ON orders(created_at);
```

### Table 7: `order_items`

Stores items in each order (one-to-many relationship).

```sql
CREATE TABLE order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id VARCHAR(50) NOT NULL,
    menu_item_id VARCHAR(50) NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    price DECIMAL(10, 2) NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (menu_item_id) REFERENCES menu_items(id)
);

CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_order_items_menu_item ON order_items(menu_item_id);
```

### Table 8: `bills`

Stores generated bills (optional - can be generated on-demand).

```sql
CREATE TABLE bills (
    id VARCHAR(50) PRIMARY KEY,
    order_id VARCHAR(50) NOT NULL UNIQUE,
    table_number INTEGER NOT NULL,
    subtotal DECIMAL(10, 2) NOT NULL,
    tax DECIMAL(10, 2) NOT NULL,
    total DECIMAL(10, 2) NOT NULL,
    payment_method VARCHAR(50) NOT NULL 
        CHECK (payment_method IN ('cash', 'card', 'digital')),
    payment_status VARCHAR(50) NOT NULL DEFAULT 'pending' 
        CHECK (payment_status IN ('pending', 'paid')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    paid_at TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id),
    FOREIGN KEY (table_number) REFERENCES tables(number)
);

CREATE INDEX idx_bills_order ON bills(order_id);
CREATE INDEX idx_bills_payment_status ON bills(payment_status);
CREATE INDEX idx_bills_created_at ON bills(created_at);
```

### Table 9: `staff_users` (Optional - for future authentication)

Stores staff user accounts.

```sql
CREATE TABLE staff_users (
    id VARCHAR(50) PRIMARY KEY,
    username VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL, -- should be hashed (bcrypt/argon2)
    role VARCHAR(50) NOT NULL 
        CHECK (role IN ('waiter', 'manager', 'chef')),
    name VARCHAR(255),
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP
);

CREATE INDEX idx_staff_users_username ON staff_users(username);
CREATE INDEX idx_staff_users_role ON staff_users(role);
```

---

## Migration Steps: From In-Memory to SQL Database

### Step 1: Choose Your Database

**Option A: SQLite (Recommended for Development)**
```bash
npm install sqlite3
npm install @types/sqlite3 --save-dev
```

**Option B: PostgreSQL (Recommended for Production)**
```bash
npm install pg
npm install @types/pg --save-dev
```

### Step 2: Install Database Library

For SQLite:
```bash
npm install better-sqlite3
npm install @types/better-sqlite3 --save-dev
```

For PostgreSQL:
```bash
npm install pg
npm install @types/pg --save-dev
```

### Step 3: Create Database Configuration File

Create `src/config/database.ts`:

```typescript
// For SQLite
import Database from 'better-sqlite3';

const db = new Database('restaurant.db');

// Enable foreign keys
db.pragma('foreign_keys = ON');

export default db;
```

OR for PostgreSQL:

```typescript
// For PostgreSQL
import { Pool } from 'pg';

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'restaurant_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
});

export default pool;
```

### Step 4: Create Database Schema

Create `src/database/schema.sql` with all the CREATE TABLE statements from above.

Create `src/database/migrate.ts`:

```typescript
import db from '../config/database';
import fs from 'fs';
import path from 'path';

export function initializeDatabase() {
  // Read SQL schema file
  const schemaPath = path.join(__dirname, 'schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf-8');

  // Execute schema (split by semicolons for SQLite)
  db.exec(schema);

  // Seed initial data
  seedInitialData();
}

function seedInitialData() {
  // Insert sample menu items, tables, etc.
  // See src/data/sampleData.ts for reference
}
```

### Step 5: Update Server Code

**Before (In-Memory):**
```typescript
let reservations: Reservation[] = [...sampleReservations];

app.post('/api/reservations', (req, res) => {
  const reservation = { id: `res_${Date.now()}`, ...req.body };
  reservations.push(reservation);
  res.json(reservation);
});
```

**After (SQL Database):**
```typescript
import db from './config/database';

app.post('/api/reservations', (req, res) => {
  const { customerName, customerEmail, customerPhone, tableNumber, 
          reservationDate, reservationTime, endTime, numberOfGuests } = req.body;

  // Check for conflicts
  const conflicts = db.prepare(`
    SELECT * FROM reservations 
    WHERE table_number = ? AND reservation_date = ?
    AND status != 'cancelled'
    AND (
      (? >= reservation_time AND ? < end_time) OR
      (? > reservation_time AND ? <= end_time) OR
      (? <= reservation_time AND ? >= end_time)
    )
  `).all(tableNumber, reservationDate, 
         reservationTime, reservationTime, 
         endTime, endTime,
         reservationTime, endTime);

  if (conflicts.length > 0) {
    return res.status(400).json({ error: 'Time conflict detected' });
  }

  // Insert reservation
  const id = `res_${Date.now()}`;
  const stmt = db.prepare(`
    INSERT INTO reservations 
    (id, customer_name, customer_email, customer_phone, table_number,
     reservation_date, reservation_time, end_time, number_of_guests)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(id, customerName, customerEmail, customerPhone, tableNumber,
           reservationDate, reservationTime, endTime, numberOfGuests);

  res.json({ id, ...req.body, status: 'pending' });
});
```

### Step 6: Update API Endpoints

Replace all in-memory array operations with database queries:

1. **GET endpoints**: Use `SELECT` queries
2. **POST endpoints**: Use `INSERT` statements
3. **PUT endpoints**: Use `UPDATE` statements
4. **DELETE endpoints**: Use `DELETE` statements

### Step 7: Migrate Existing Data (One-Time)

Create a migration script `src/database/migrate-data.ts`:

```typescript
import { sampleMenuItems, sampleTables } from '../data/sampleData';

export function migrateSampleData() {
  // Insert menu items
  const insertMenuItem = db.prepare(`
    INSERT INTO menu_items (id, name, description, price, category, image_url, available)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  for (const item of sampleMenuItems) {
    insertMenuItem.run(item.id, item.name, item.description, item.price, 
                      item.category, item.imageUrl, item.available);
    
    // Insert ingredients
    const insertIngredient = db.prepare(`
      INSERT INTO menu_item_ingredients (menu_item_id, ingredient)
      VALUES (?, ?)
    `);
    item.ingredients.forEach(ing => insertIngredient.run(item.id, ing));
    
    // Insert allergens
    const insertAllergen = db.prepare(`
      INSERT INTO menu_item_allergens (menu_item_id, allergen)
      VALUES (?, ?)
    `);
    item.allergens.forEach(all => insertAllergen.run(item.id, all));
  }

  // Insert tables
  const insertTable = db.prepare(`
    INSERT INTO tables (id, number, capacity, status)
    VALUES (?, ?, ?, ?)
  `);

  for (const table of sampleTables) {
    insertTable.run(table.id, table.number, table.capacity, table.status);
  }
}
```

### Step 8: Environment Variables

Create `.env` file:

```env
# Database Configuration (PostgreSQL)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=restaurant_db
DB_USER=postgres
DB_PASSWORD=your_password

# For SQLite (no env vars needed - uses file)
# Database file: restaurant.db (in project root)
```

### Step 9: Update package.json Scripts

```json
{
  "scripts": {
    "build": "tsc && tsc -p tsconfig.public.json",
    "start": "node dist/server.js",
    "dev": "ts-node src/server.ts",
    "db:migrate": "ts-node src/database/migrate.ts",
    "db:seed": "ts-node src/database/migrate-data.ts"
  }
}
```

### Step 10: Testing

1. **Initialize database**: `npm run db:migrate`
2. **Seed data**: `npm run db:seed`
3. **Start server**: `npm start`
4. **Test API endpoints**: Verify all CRUD operations work

---

## Key Differences: In-Memory vs SQL Database

| Aspect | In-Memory | SQL Database |
|--------|-----------|--------------|
| **Persistence** | Lost on restart | Survives restarts |
| **Data Integrity** | No constraints | Foreign keys, constraints |
| **Query Performance** | Fast for small data | Optimized with indexes |
| **Scalability** | Limited by RAM | Handles large datasets |
| **Concurrency** | Race conditions possible | Transaction-safe |
| **Backup** | Not possible | Standard backup tools |
| **Complex Queries** | Manual filtering | SQL JOIN, GROUP BY, etc. |
| **Setup Complexity** | No setup needed | Requires database setup |

---

## Example: Complete Reservation Endpoint (SQLite)

```typescript
import db from './config/database';

// GET /api/reservations
app.get('/api/reservations', (req, res) => {
  const reservations = db.prepare('SELECT * FROM reservations ORDER BY reservation_date, reservation_time').all();
  res.json(reservations);
});

// POST /api/reservations
app.post('/api/reservations', (req, res) => {
  const { tableNumber, reservationDate, reservationTime, endTime, 
          customerName, customerEmail, customerPhone, numberOfGuests } = req.body;

  // Check for time conflicts
  const conflicts = db.prepare(`
    SELECT * FROM reservations 
    WHERE table_number = ? 
    AND reservation_date = ?
    AND status != 'cancelled'
    AND (
      (reservation_time <= ? AND end_time > ?) OR
      (reservation_time < ? AND end_time >= ?) OR
      (reservation_time >= ? AND end_time <= ?)
    )
  `).all(tableNumber, reservationDate, 
         reservationTime, reservationTime,
         endTime, endTime,
         reservationTime, endTime);

  if (conflicts.length > 0) {
    return res.status(400).json({ 
      error: 'Table is already reserved for this time slot' 
    });
  }

  // Insert reservation
  const id = `res_${Date.now()}`;
  const insert = db.prepare(`
    INSERT INTO reservations 
    (id, customer_name, customer_email, customer_phone, table_number,
     reservation_date, reservation_time, end_time, number_of_guests, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')
  `);

  try {
    insert.run(id, customerName, customerEmail, customerPhone, tableNumber,
               reservationDate, reservationTime, endTime, numberOfGuests);
    
    const reservation = db.prepare('SELECT * FROM reservations WHERE id = ?').get(id);
    res.status(201).json(reservation);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create reservation' });
  }
});
```

---

## Additional Recommendations

### 1. Use an ORM (Optional but Recommended)

Consider using an ORM like **TypeORM** or **Prisma** for better type safety:

```bash
npm install typeorm sqlite3 reflect-metadata
```

### 2. Connection Pooling (PostgreSQL)

For PostgreSQL, use connection pooling to handle concurrent requests:

```typescript
import { Pool } from 'pg';

const pool = new Pool({
  max: 20, // Maximum pool size
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});
```

### 3. Database Migrations

Use a migration tool like **db-migrate** or **knex** for version control:

```bash
npm install db-migrate db-migrate-pg
```

### 4. Environment-Specific Configs

```typescript
// src/config/database.ts
const isDevelopment = process.env.NODE_ENV === 'development';

if (isDevelopment) {
  // Use SQLite
  export default new Database('restaurant_dev.db');
} else {
  // Use PostgreSQL
  export default new Pool({ /* production config */ });
}
```

---

## Summary

Migrating from in-memory storage to SQL provides:
- ✅ Persistent data storage
- ✅ Better data integrity and validation
- ✅ Improved query performance with indexes
- ✅ Transaction support for data consistency
- ✅ Scalability for growing datasets
- ✅ Standard backup and recovery options

The migration process involves:
1. Installing database drivers
2. Creating database schema
3. Replacing in-memory operations with SQL queries
4. Migrating existing data
5. Testing all endpoints

Choose **SQLite for development** (simple, file-based) and **PostgreSQL for production** (robust, enterprise-grade).
