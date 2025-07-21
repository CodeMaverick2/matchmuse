const { Pool } = require('pg');
const logger = require('../utils/logger');

class Database {
  constructor() {
    this.pool = null;
  }

  async connect() {
    if (this.pool) return this.pool;
    this.pool = new Pool({
      connectionString: process.env.PG_URL,
      max: 10,
      idleTimeoutMillis: 30000,
      ssl: { rejectUnauthorized: false }, // Enable SSL for Render
    });
    try {
      await this.pool.query('SELECT 1');
      logger.info('Connected to PostgreSQL database');
    } catch (err) {
      logger.error('Error connecting to PostgreSQL:', err);
      throw err;
    }
    return this.pool;
  }

  async disconnect() {
    if (this.pool) {
      await this.pool.end();
      logger.info('PostgreSQL connection pool closed');
      this.pool = null;
    }
  }

  async run(sql, params = []) {
    if (!this.pool) await this.connect();
    try {
      const result = await this.pool.query(sql, params);
      return { rowCount: result.rowCount, rows: result.rows };
    } catch (err) {
      logger.error('Database run error:', err);
      throw err;
    }
  }

  async get(sql, params = []) {
    if (!this.pool) await this.connect();
    try {
      const result = await this.pool.query(sql, params);
      return result.rows[0] || null;
    } catch (err) {
      logger.error('Database get error:', err);
      throw err;
    }
  }

  async all(sql, params = []) {
    if (!this.pool) await this.connect();
    try {
      const result = await this.pool.query(sql, params);
      return result.rows;
    } catch (err) {
      logger.error('Database all error:', err);
      throw err;
    }
  }

  async exec(sql) {
    if (!this.pool) await this.connect();
    try {
      await this.pool.query(sql);
    } catch (err) {
      logger.error('Database exec error:', err);
      throw err;
    }
  }

  async transaction(callback) {
    if (!this.pool) await this.connect();
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // Helper method to parse JSON fields
  parseJsonField(field) {
    if (!field) return null;
    try {
      return typeof field === 'string' ? JSON.parse(field) : field;
    } catch (error) {
      logger.warn('Error parsing JSON field:', error);
      return null;
    }
  }

  // Helper method to stringify JSON fields
  stringifyJsonField(field) {
    if (!field) return null;
    try {
      return typeof field === 'string' ? field : JSON.stringify(field);
    } catch (error) {
      logger.warn('Error stringifying JSON field:', error);
      return null;
    }
  }
}

// Create singleton instance
const database = new Database();

module.exports = database; 