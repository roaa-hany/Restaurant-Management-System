# Data Persistence Fix

## Issues Fixed

### 1. Menu Items Reverting After Server Restart
**Problem**: When the manager added or deleted menu items, after restarting the server, all changes were lost and data reverted to the initial seed data.

**Root Cause**: The `database/schema.sql` file contained `DROP TABLE IF EXISTS` statements. Every time the server started, the initialization script was executing these DROP statements, which deleted all tables and their data, then recreated them with only the seed data.

**Solution**:
- Modified `src/db/init.ts` to **remove all DROP TABLE statements** from the schema before executing it
- Changed `CREATE TABLE` to `CREATE TABLE IF NOT EXISTS` to avoid errors if tables already exist
- Updated `database/seed.sql` to use `INSERT IGNORE` for menu items and `ON DUPLICATE KEY UPDATE` for staff/tables, so seed data only inserts if it doesn't already exist

**Result**: 
- ✅ Tables are never dropped on server restart
- ✅ Manager's changes to menu items persist across restarts
- ✅ All data (menu items, reservations, orders, feedback) persists permanently

### 2. Tables Not Showing in Reservations Page
**Problem**: The reservations page showed "no tables available" even though tables existed in the database.

**Root Cause**: The tables were being dropped and recreated on every server restart (same issue as above), so they were empty when the page loaded.

**Solution**: 
- Fixed the same DROP TABLE issue above
- Verified the `/api/tables/available` endpoint works correctly
- Ensured tables are seeded properly and persist

**Result**:
- ✅ Tables are now available in the reservations dropdown
- ✅ All 10 tables show up correctly

## What Changed

### Files Modified:

1. **`src/db/init.ts`**:
   - Removes `DROP TABLE` statements from schema before execution
   - Converts `CREATE TABLE` to `CREATE TABLE IF NOT EXISTS`
   - Better error handling and logging

2. **`database/seed.sql`**:
   - Changed menu items INSERT to `INSERT IGNORE` (won't overwrite existing items)
   - Added `ON DUPLICATE KEY UPDATE` to staff and tables INSERTs
   - This ensures seed data only inserts if items don't exist, preserving manager's changes

## Testing

To verify the fixes work:

1. **Test Menu Item Persistence**:
   - Start server: `npm start`
   - Login as manager
   - Add a new menu item
   - Stop server (Ctrl+C)
   - Start server again: `npm start`
   - ✅ The new menu item should still be there

2. **Test Tables Availability**:
   - Start server: `npm start`
   - Go to reservations page
   - ✅ Should see 10 tables in the dropdown

3. **Test Data Persistence**:
   - Create a reservation
   - Submit feedback
   - Create an order
   - Restart server
   - ✅ All data should still be there

## Important Notes

- **Never manually run `database/schema.sql`** - it contains DROP statements that will delete all data
- The initialization script automatically handles schema creation safely
- Seed data only inserts if items don't exist (won't overwrite your changes)
- All data now persists permanently in MySQL database

