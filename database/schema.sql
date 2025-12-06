-- Restaurant Management System Database Schema
-- MySQL Database Schema for Restaurant Management System

-- Create database if it doesn't exist
CREATE DATABASE IF NOT EXISTS restaurant_db;
USE restaurant_db;

-- Drop tables if they exist (for clean migration)
DROP TABLE IF EXISTS feedback;
DROP TABLE IF EXISTS bills;
DROP TABLE IF EXISTS order_items;
DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS reservations;
DROP TABLE IF EXISTS menu_items;
DROP TABLE IF EXISTS tables;
DROP TABLE IF EXISTS staff;

-- ==================== STAFF TABLE ====================
CREATE TABLE staff (
    id VARCHAR(50) PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('waiter', 'manager', 'chef') NOT NULL,
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ==================== TABLES TABLE ====================
CREATE TABLE tables (
    id VARCHAR(50) PRIMARY KEY,
    number INT UNIQUE NOT NULL,
    capacity INT NOT NULL,
    status ENUM('available', 'occupied', 'reserved', 'need-assistance', 'maintenance') DEFAULT 'available',
    assigned_waiter VARCHAR(50) NULL,
    current_order VARCHAR(50) NULL,
    location VARCHAR(100) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (assigned_waiter) REFERENCES staff(id) ON DELETE SET NULL
);

-- ==================== MENU ITEMS TABLE ====================
CREATE TABLE menu_items (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    category VARCHAR(50) NOT NULL,
    image_url VARCHAR(500) DEFAULT '',
    ingredients JSON,
    allergens JSON,
    available BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ==================== RESERVATIONS TABLE ====================
CREATE TABLE reservations (
    id VARCHAR(50) PRIMARY KEY,
    customer_name VARCHAR(100) NOT NULL,
    customer_email VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(20) NOT NULL,
    table_number INT NOT NULL,
    reservation_date DATE NOT NULL,
    reservation_time TIME NOT NULL,
    end_time TIME NOT NULL,
    number_of_guests INT NOT NULL,
    status ENUM('pending', 'confirmed', 'cancelled') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (table_number) REFERENCES tables(number) ON DELETE CASCADE,
    INDEX idx_table_date (table_number, reservation_date),
    INDEX idx_status (status)
);

-- ==================== ORDERS TABLE ====================
CREATE TABLE orders (
    id VARCHAR(50) PRIMARY KEY,
    table_number INT NOT NULL,
    status ENUM('pending', 'preparing', 'ready', 'completed', 'served', 'paid') DEFAULT 'pending',
    assigned_waiter VARCHAR(50) NULL,
    customer_name VARCHAR(100) NULL,
    assigned_chef VARCHAR(50) NULL,
    chef_name VARCHAR(100) NULL,
    estimated_prep_time INT NULL,
    start_time TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (table_number) REFERENCES tables(number) ON DELETE CASCADE,
    FOREIGN KEY (assigned_waiter) REFERENCES staff(id) ON DELETE SET NULL,
    INDEX idx_status (status),
    INDEX idx_table (table_number),
    INDEX idx_waiter (assigned_waiter)
);

-- ==================== ORDER ITEMS TABLE ====================
CREATE TABLE order_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id VARCHAR(50) NOT NULL,
    menu_item_id VARCHAR(50) NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    price DECIMAL(10, 2) NOT NULL,
    notes TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (menu_item_id) REFERENCES menu_items(id) ON DELETE CASCADE,
    INDEX idx_order (order_id)
);

-- ==================== BILLS TABLE ====================
CREATE TABLE bills (
    id VARCHAR(50) PRIMARY KEY,
    order_id VARCHAR(50) NOT NULL,
    table_number INT NOT NULL,
    subtotal DECIMAL(10, 2) NOT NULL,
    tax DECIMAL(10, 2) NOT NULL,
    total DECIMAL(10, 2) NOT NULL,
    payment_method ENUM('cash', 'card', 'digital') DEFAULT 'cash',
    payment_status ENUM('pending', 'paid') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (table_number) REFERENCES tables(number) ON DELETE CASCADE,
    INDEX idx_order (order_id),
    INDEX idx_payment_status (payment_status)
);

-- ==================== FEEDBACK TABLE ====================
CREATE TABLE feedback (
    id VARCHAR(50) PRIMARY KEY,
    customer_name VARCHAR(100) NOT NULL,
    customer_email VARCHAR(255) NOT NULL,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT NOT NULL,
    status ENUM('pending', 'reviewed') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_status (status),
    INDEX idx_rating (rating),
    INDEX idx_created_at (created_at)
);

