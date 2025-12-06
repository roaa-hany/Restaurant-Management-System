# Quick Database Setup Guide

## The Problem
You're getting: `Access denied for user 'root'@'localhost' (using password: NO)`

This means MySQL requires a password, but the app is trying to connect without one.

## Solution: Set Your MySQL Password

### Option 1: Edit .env File (Recommended)

1. Open the `.env` file in the project root
2. Add your MySQL root password:
   ```
   DB_PASSWORD=your_actual_mysql_password
   ```
3. Save the file
4. Restart the server: `npm start`

### Option 2: Use Environment Variable

Set the password before starting the server:

```bash
export DB_PASSWORD=your_actual_mysql_password
npm start
```

### Option 3: If You Don't Know Your MySQL Password

#### Reset MySQL Root Password (macOS):

1. Stop MySQL:
   ```bash
   sudo /usr/local/mysql/support-files/mysql.server stop
   ```

2. Start MySQL in safe mode:
   ```bash
   sudo /usr/local/mysql/bin/mysqld_safe --skip-grant-tables
   ```

3. In a new terminal, connect without password:
   ```bash
   /usr/local/mysql/bin/mysql -u root
   ```

4. Reset password:
   ```sql
   USE mysql;
   UPDATE user SET authentication_string=PASSWORD('newpassword') WHERE User='root';
   FLUSH PRIVILEGES;
   EXIT;
   ```

5. Restart MySQL normally and use the new password

#### Alternative: Create a New MySQL User

If you prefer not to use root:

1. Connect to MySQL as root:
   ```bash
   mysql -u root -p
   ```

2. Create a new user:
   ```sql
   CREATE USER 'restaurant_user'@'localhost' IDENTIFIED BY 'your_secure_password';
   GRANT ALL PRIVILEGES ON restaurant_db.* TO 'restaurant_user'@'localhost';
   FLUSH PRIVILEGES;
   EXIT;
   ```

3. Update `.env` file:
   ```
   DB_USER=restaurant_user
   DB_PASSWORD=your_secure_password
   ```

### Option 4: If MySQL Has No Password (Uncommon)

If your MySQL root user truly has no password, you can try:

1. Connect to MySQL:
   ```bash
   mysql -u root
   ```

2. If that works, then update `.env` to leave password empty:
   ```
   DB_PASSWORD=
   ```

   But this is **NOT RECOMMENDED** for security reasons.

## Verify MySQL is Running

Check if MySQL is running:

```bash
# macOS
brew services list | grep mysql
# or
ps aux | grep mysql

# If not running, start it:
brew services start mysql
# or
sudo /usr/local/mysql/support-files/mysql.server start
```

## Test Connection

After setting the password, test the connection:

```bash
mysql -u root -p
# Enter your password when prompted
```

If this works, your `.env` file should work too.

## Quick Fix Summary

1. **Find your MySQL root password** (or reset it)
2. **Edit `.env` file** and add: `DB_PASSWORD=your_password`
3. **Restart server**: `npm start`

The server will now connect successfully!

