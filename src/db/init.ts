/**
 * Database initialization script
 * This script creates the database schema and seeds initial data
 */

import { adminPool, pool } from './config';
import fs from 'fs';
import path from 'path';

export async function initializeDatabase(): Promise<void> {
  try {
    console.log('Initializing database...');
    
    // First, ensure the database exists
    const dbName = process.env.DB_NAME || 'restaurant_db';
    try {
      await adminPool.execute(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
      console.log(`✓ Database '${dbName}' created or already exists`);
    } catch (error: any) {
      console.warn('⚠ Could not create database:', error.message);
      // Continue anyway - database might already exist
    }
    
    // Read schema SQL file
    // Use process.cwd() for better path resolution (works for both dev and compiled)
    const schemaPath = path.join(process.cwd(), 'database', 'schema.sql');
    
    if (!fs.existsSync(schemaPath)) {
      console.warn('⚠ Schema file not found at:', schemaPath);
      console.warn('⚠ Skipping automatic schema creation. Please run schema.sql manually.');
      return;
    }
    
    const schemaSQL = fs.readFileSync(schemaPath, 'utf-8');
    
    // CRITICAL: Remove DROP TABLE statements to preserve existing data!
    // We don't want to drop tables on every server restart - that would lose all data!
    let cleanSchemaSQL = schemaSQL
      .replace(/DROP TABLE IF EXISTS[^;]*;/gi, '') // Remove DROP statements - preserve data!
      .replace(/DROP TABLE[^;]*;/gi, '') // Remove any DROP TABLE statements
      .replace(/CREATE DATABASE[^;]*;/gi, '') // Remove CREATE DATABASE (already done)
      .replace(/USE[^;]*;/gi, ''); // Remove USE statements
    
    // Change CREATE TABLE to CREATE TABLE IF NOT EXISTS to avoid errors on existing tables
    cleanSchemaSQL = cleanSchemaSQL.replace(/CREATE TABLE\s+(\w+)/gi, 'CREATE TABLE IF NOT EXISTS $1');
    
    // Remove comments and split by semicolon
    const statements = cleanSchemaSQL
      .split(';')
      .map(s => {
        // Remove single-line comments
        s = s.replace(/--.*$/gm, '');
        // Remove multi-line comments (simple version)
        s = s.replace(/\/\*[\s\S]*?\*\//g, '');
        return s.trim();
      })
      .filter(s => s.length > 0);
    
    let successCount = 0;
    let skippedCount = 0;
    for (const statement of statements) {
      if (statement && statement.length > 10) {
        try {
          await pool.execute(statement);
          successCount++;
        } catch (error: any) {
          // Ignore "already exists" and "duplicate" errors
          if (error.message.includes('already exists') || 
              error.message.includes('Duplicate') ||
              error.message.includes('Duplicate key') ||
              error.code === 'ER_DUP_KEYNAME' ||
              error.code === 'ER_TABLE_EXISTS_ERROR') {
            skippedCount++;
            // Silently ignore - table/constraint already exists
          } else {
            console.warn(`⚠ Warning executing statement: ${error.message}`);
            if (error.message.includes('syntax')) {
              console.warn(`  Statement: ${statement.substring(0, 100)}...`);
            }
          }
        }
      }
    }
    
    if (successCount > 0) {
      console.log(`✓ Database schema created (${successCount} tables created, ${skippedCount} already existed)`);
    } else if (skippedCount > 0) {
      console.log(`✓ Database schema verified (all ${skippedCount} tables already exist)`);
    }
    
    // Read seed SQL file
    const seedPath = path.join(process.cwd(), 'database', 'seed.sql');
    
    if (!fs.existsSync(seedPath)) {
      console.warn('⚠ Seed file not found at:', seedPath);
      console.warn('⚠ Skipping automatic data seeding.');
      return;
    }
    
    const seedSQL = fs.readFileSync(seedPath, 'utf-8');
    
    // Remove USE statement and comments, then split by semicolon
    let cleanSeedSQL = seedSQL
      .replace(/USE[^;]*;/gi, '')
      .replace(/--.*$/gm, '') // Remove single-line comments
      .replace(/\/\*[\s\S]*?\*\//g, ''); // Remove multi-line comments
    
    // Split by semicolon, but be careful with multi-line statements
    const seedStatements = cleanSeedSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);
    
    let insertedCount = 0;
    for (const statement of seedStatements) {
      if (statement && statement.length > 10) {
        try {
          await pool.execute(statement);
          insertedCount++;
        } catch (error: any) {
          // Ignore duplicate entry errors for seed data
          if (error.message.includes('Duplicate entry') || 
              error.code === 'ER_DUP_ENTRY') {
            // Silently ignore - data already exists
          } else {
            console.warn(`⚠ Warning executing seed: ${error.message}`);
            if (insertedCount === 0) {
              console.warn(`  First statement that failed: ${statement.substring(0, 150)}...`);
            }
          }
        }
      }
    }
    
    if (insertedCount > 0) {
      console.log(`✓ Database seeded with initial data (${insertedCount} statements executed)`);
    } else {
      console.log('✓ Database already contains seed data (or seeding skipped)');
    }
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
}

