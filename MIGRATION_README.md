# MySQL Database Migration Guide

This document explains the complete migration process from in-memory storage to MySQL database for the Restaurant Management System.

## Overview

The system has been migrated from in-memory JavaScript arrays to a persistent MySQL database. This migration provides:
- **Data Persistence**: Data survives server restarts
- **Scalability**: Better performance and concurrent access handling
- **Data Integrity**: Foreign key constraints and validation at the database level
- **Feedback System**: New feature to collect and store customer feedback permanently

## Migration Summary

### What Changed

1. **Database Layer**: Added MySQL connection pool and query helpers
2. **API Endpoints**: All endpoints now use database queries instead of in-memory arrays
3. **New Features**:
   - Customer feedback system with permanent storage
   - Improved payment processing that automatically frees tables
   - Paid orders automatically removed from billing list
4. **Data Structure**: All data now stored in MySQL tables with proper relationships

### What Stayed the Same

- All API endpoints maintain the same interface
- Frontend code requires no changes
- Existing functionality preserved

## Prerequisites

Before starting the migration, ensure you have:

1. **MySQL Server** installed (version 5.7+ or 8.0+)
   - Windows: Download from [MySQL Downloads](https://dev.mysql.com/downloads/mysql/)
   - macOS: `brew install mysql` or download installer
   - Linux: `sudo apt-get install mysql-server` (Ubuntu/Debian) or `sudo yum install mysql-server` (CentOS/RHEL)

2. **Node.js** and **npm** installed (already required for the project)

3. **Database credentials**:
   - Database name: `restaurant_db` (will be created automatically)
   - Default username: `root`
   - Default password: (empty/your MySQL root password)

## Installation Steps

### Step 1: Install MySQL Dependencies

```bash
npm install mysql2 @types/mysql2
```

### Step 2: Set Up MySQL Database

#### Option A: Using MySQL Command Line

1. Start MySQL server:
   ```bash
   # Windows (if installed as service, it should start automatically)
   # macOS/Linux
   sudo systemctl start mysql
   # or
   mysql.server start
   ```

2. Log in to MySQL:
   ```bash
   mysql -u root -p
   ```

3. Create the database (optional - script will create it automatically):
   ```sql
   CREATE DATABASE IF NOT EXISTS restaurant_db;
   ```

#### Option B: Using MySQL Workbench or phpMyAdmin

Create a new database named `restaurant_db` using your preferred MySQL client.

### Step 3: Configure Database Connection

Edit the database configuration in `src/db/config.ts` or set environment variables:

```bash
# Using environment variables (recommended for production)
export DB_HOST=localhost
export DB_USER=root
export DB_PASSWORD=your_password
export DB_NAME=restaurant_db
```

Or modify `src/db/config.ts` directly:
```typescript
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'restaurant_db',
  // ... other settings
};
```

### Step 4: Run Database Schema and Seed Scripts

The system will automatically create the database schema and seed initial data when you start the server for the first time. However, you can also run the SQL scripts manually:

#### Manual Schema Creation

1. Run the schema script:
   ```bash
   mysql -u root -p < database/schema.sql
   ```

2. Seed initial data:
   ```bash
   mysql -u root -p < database/seed.sql
   ```

#### Automatic (Recommended)

The server will automatically initialize the database on first start. Just run:

```bash
npm run build
npm start
```

The server will:
- Test the database connection
- Create all tables if they don't exist
- Seed initial data (staff, tables, menu items)

### Step 5: Start the Server

```bash
# Build the project
npm run build

# Start the server
npm start

# Or for development with auto-reload
npm run dev
```

The server will display connection status:
- ✓ Database connected successfully
- ✓ Database schema created
- ✓ Database seeded with initial data

## Database Schema

### Tables Created

1. **staff** - Staff member credentials and roles
2. **tables** - Restaurant table information
3. **menu_items** - Menu items with ingredients and allergens
4. **reservations** - Table reservations with time ranges
5. **orders** - Customer orders
6. **order_items** - Individual items in each order
7. **bills** - Generated bills for orders
8. **feedback** - Customer feedback and ratings

### Key Relationships

- `orders.table_number` → `tables.number`
- `order_items.order_id` → `orders.id`
- `order_items.menu_item_id` → `menu_items.id`
- `reservations.table_number` → `tables.number`
- `bills.order_id` → `orders.id`
- `tables.assigned_waiter` → `staff.id`

## Migration Details

### Changes to Data Storage

#### Before (In-Memory)
```typescript
let menuItems: MenuItem[] = [...sampleMenuItems];
let orders: Order[] = [...sampleOrders];
// Data lost on server restart
```

#### After (MySQL)
```typescript
const menuItems = await db.getAllMenuItems();
const orders = await db.getAllOrders();
// Data persisted in database
```

### API Endpoints Updated

All endpoints now use async/await with database queries:

- `GET /api/menu` - Fetches from `menu_items` table
- `POST /api/menu` - Inserts into `menu_items` table
- `GET /api/orders` - Fetches from `orders` and `order_items` tables
- `POST /api/orders` - Creates order with transaction
- `POST /api/bills/:id/pay` - Updates order status and frees table
- And all other endpoints...

### New Features

#### 1. Feedback System

**API Endpoints:**
- `POST /api/feedback` - Submit customer feedback
- `GET /api/feedback` - Get all feedback (for managers)

**Frontend:**
- New "Feedback" tab on customer menu page
- Feedback form with rating (1-5 stars) and comment
- All feedback permanently stored in database

#### 2. Improved Payment Processing

When a payment is processed:
1. Order status updated to 'paid' in database
2. Table automatically marked as 'available'
3. Waiter assignment cleared
4. Order removed from billing list (filtered by status)

**Implementation:**
```typescript
// In POST /api/bills/:id/pay
await db.updateOrderStatus(orderId, 'paid');
await db.updateTable(table.id, {
  status: 'available',
  assignedWaiter: undefined,
  currentOrder: undefined
});
```

#### 3. Billing ID Format Fix

Fixed inconsistency between frontend (`BILL_`) and backend (`bill_`):
- Frontend now consistently uses `BILL_` prefix
- Backend accepts both formats for compatibility
- Bills stored with `BILL_` prefix in database

## Data Migration (If You Have Existing Data)

If you have existing data in the old in-memory system:

1. **Export Data**: Before migrating, you may want to export any important data
2. **Manual Import**: Use the sample data scripts as templates and insert your data into the database
3. **API Import**: Create a temporary script to read from old format and insert into database

Example migration script structure:
```typescript
// migration-script.ts
import * as db from './db/queries';

async function migrateOldData() {
  // Read old data format
  const oldMenuItems = [...sampleMenuItems];
  
  // Insert into database
  for (const item of oldMenuItems) {
    await db.createMenuItem(item);
  }
}
```

## Differences from Previous System

### Data Persistence
- **Before**: Data lost on server restart
- **After**: Data persists in MySQL database

### Performance
- **Before**: Fast reads from memory, but limited scalability
- **After**: Slightly slower reads, but handles concurrent requests better

### Data Integrity
- **Before**: No validation, could have orphaned data
- **After**: Foreign key constraints ensure data integrity

### Scalability
- **Before**: Single server instance only
- **After**: Can scale across multiple server instances using same database

### Features
- **Before**: No feedback system
- **After**: Complete feedback system with permanent storage

## Troubleshooting

### Database Connection Errors

**Error**: `ECONNREFUSED` or `Can't connect to MySQL server`

**Solutions**:
1. Ensure MySQL server is running:
   ```bash
   # Check MySQL status
   sudo systemctl status mysql
   # Start MySQL
   sudo systemctl start mysql
   ```

2. Verify connection settings in `src/db/config.ts`

3. Check MySQL is listening on correct port (default: 3306)

### Permission Denied Errors

**Error**: `Access denied for user 'root'@'localhost'`

**Solutions**:
1. Verify MySQL username and password
2. Create a dedicated database user:
   ```sql
   CREATE USER 'restaurant_user'@'localhost' IDENTIFIED BY 'secure_password';
   GRANT ALL PRIVILEGES ON restaurant_db.* TO 'restaurant_user'@'localhost';
   FLUSH PRIVILEGES;
   ```
3. Update `src/db/config.ts` with new credentials

### Table Already Exists Errors

**Error**: `Table 'menu_items' already exists`

**Solutions**:
1. This is normal if database was previously initialized
2. Scripts are idempotent - safe to run multiple times
3. To start fresh, drop and recreate database:
   ```sql
   DROP DATABASE restaurant_db;
   CREATE DATABASE restaurant_db;
   ```

### Foreign Key Constraint Errors

**Error**: `Cannot add or update a child row: a foreign key constraint fails`

**Solutions**:
1. Ensure referenced records exist (e.g., table exists before creating reservation)
2. Check that IDs match correctly
3. Verify data integrity in your inserts

## Environment Variables

For production deployment, use environment variables:

```bash
# .env file
DB_HOST=localhost
DB_USER=restaurant_user
DB_PASSWORD=secure_password
DB_NAME=restaurant_db
```

Load with `dotenv` package:
```bash
npm install dotenv
```

```typescript
// At top of server.ts
import 'dotenv/config';
```

## Backup and Restore

### Backup Database

```bash
mysqldump -u root -p restaurant_db > backup.sql
```

### Restore Database

```bash
mysql -u root -p restaurant_db < backup.sql
```

## Testing the Migration

After migration, verify:

1. **Menu Items Load**: Visit `http://localhost:3000/index.html`
2. **Reservations Work**: Create a test reservation
3. **Orders Work**: Create an order as waiter
4. **Payment Works**: Process payment and verify table becomes available
5. **Feedback Works**: Submit feedback from customer page
6. **Data Persists**: Restart server and verify data still exists

## Rollback Plan

If you need to revert to in-memory storage:

1. Replace `src/server.ts` with previous version
2. Remove MySQL dependencies: `npm uninstall mysql2 @types/mysql2`
3. Restart server

**Note**: Data in MySQL database will remain but won't be used.

## Support and Maintenance

### Regular Maintenance

1. **Backup**: Schedule regular database backups
2. **Optimization**: Run `OPTIMIZE TABLE` periodically
3. **Monitoring**: Monitor database size and query performance

### Performance Optimization

For production:
- Add indexes on frequently queried columns
- Configure connection pool size appropriately
- Use read replicas for heavy read workloads

## Conclusion

The migration to MySQL provides a robust, scalable foundation for the Restaurant Management System. All existing functionality is preserved while adding new features like feedback and improved data persistence.

For questions or issues, refer to:
- MySQL Documentation: https://dev.mysql.com/doc/
- Node.js mysql2: https://github.com/sidorares/node-mysql2

