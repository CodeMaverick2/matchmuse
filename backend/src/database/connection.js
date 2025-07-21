const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const logger = require('../utils/logger');

class Database {
  constructor() {
    this.db = null;
    this.dbPath = process.env.DB_PATH || './data/breadbutter.db';
  }

  async connect() {
    return new Promise((resolve, reject) => {
      // Ensure data directory exists
      const dataDir = path.dirname(this.dbPath);
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }

      this.db = new sqlite3.Database(this.dbPath, (err) => {
        if (err) {
          logger.error('Error connecting to database:', err);
          reject(err);
        } else {
          logger.info(`Connected to SQLite database: ${this.dbPath}`);
          
          // Enable foreign keys
          this.db.run('PRAGMA foreign_keys = ON');
          
          // Set WAL mode for better concurrency
          this.db.run('PRAGMA journal_mode = WAL');
          
          resolve(this.db);
        }
      });
    });
  }

  async disconnect() {
    return new Promise((resolve, reject) => {
      if (this.db) {
        this.db.close((err) => {
          if (err) {
            logger.error('Error closing database:', err);
            reject(err);
          } else {
            logger.info('Database connection closed');
            resolve();
          }
        });
      } else {
        resolve();
      }
    });
  }

  async run(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.run(sql, params, function(err) {
        if (err) {
          logger.error('Database run error:', err);
          reject(err);
        } else {
          resolve({ id: this.lastID, changes: this.changes });
        }
      });
    });
  }

  async get(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.get(sql, params, (err, row) => {
        if (err) {
          logger.error('Database get error:', err);
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }

  async all(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.all(sql, params, (err, rows) => {
        if (err) {
          logger.error('Database all error:', err);
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  async exec(sql) {
    return new Promise((resolve, reject) => {
      this.db.exec(sql, (err) => {
        if (err) {
          logger.error('Database exec error:', err);
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  async transaction(callback) {
    return new Promise(async (resolve, reject) => {
      try {
        await this.run('BEGIN TRANSACTION');
        const result = await callback();
        await this.run('COMMIT');
        resolve(result);
      } catch (error) {
        await this.run('ROLLBACK');
        reject(error);
      }
    });
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