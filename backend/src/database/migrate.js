const fs = require('fs');
const path = require('path');
const database = require('./connection');
const logger = require('../utils/logger');

async function migrate() {
  try {
    logger.info('Starting database migration...');
    
    // Connect to database
    await database.connect();
    
    // Read schema file
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    // Execute schema
    await database.exec(schema);
    
    logger.info('Database migration completed successfully');
    
  } catch (error) {
    logger.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await database.disconnect();
  }
}

// Run migration if called directly
if (require.main === module) {
  migrate();
}

module.exports = migrate; 