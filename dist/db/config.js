"use strict";
/**
 * Database configuration for MySQL connection
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.pool = exports.adminPool = void 0;
exports.testConnection = testConnection;
exports.query = query;
const promise_1 = __importDefault(require("mysql2/promise"));
// Base connection config (without database) for creating database
const baseConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    // Remove quotes if present (dotenv may include them)
    password: process.env.DB_PASSWORD?.replace(/^["']|["']$/g, '') || '',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};
// Database configuration - can be overridden by environment variables
// For security, use environment variables or .env file instead of hardcoding
const dbConfig = {
    ...baseConfig,
    database: process.env.DB_NAME || 'restaurant_db',
};
// Warn if using default empty password
if (!process.env.DB_PASSWORD && dbConfig.password === '') {
    console.warn('⚠️  WARNING: Using empty password for MySQL. Set DB_PASSWORD environment variable for security.');
    console.warn('   Example: export DB_PASSWORD=your_password');
    console.warn('   Or create a .env file with DB_PASSWORD=your_password');
}
// Create base pool (without database) for admin operations
exports.adminPool = promise_1.default.createPool(baseConfig);
// Create connection pool with database
exports.pool = promise_1.default.createPool(dbConfig);
// Test database connection
async function testConnection() {
    try {
        const connection = await exports.pool.getConnection();
        console.log('✓ Database connected successfully');
        connection.release();
        return true;
    }
    catch (error) {
        console.error('✗ Database connection failed:', error.message);
        if (error.code === 'ER_ACCESS_DENIED_ERROR') {
            console.error('\n💡 Troubleshooting tips:');
            console.error('   1. Verify your MySQL password is correct');
            console.error('   2. Check that MySQL server is running');
            console.error('   3. Try connecting manually: mysql -u root -p');
            console.error('   4. If password contains special characters, ensure it\'s quoted in .env file');
        }
        else if (error.code === 'ER_BAD_DB_ERROR' || error.message.includes('Unknown database')) {
            console.error('\n💡 Database does not exist yet. It will be created automatically.');
        }
        return false;
    }
}
// Execute a query with error handling
async function query(sql, params) {
    try {
        const [results] = await exports.pool.execute(sql, params);
        return results;
    }
    catch (error) {
        console.error('Database query error:', error);
        throw error;
    }
}
exports.default = exports.pool;
