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
    
    // Add new columns to matches table for enhanced algorithm
    await database.run(`
      ALTER TABLE matches ADD COLUMN algorithm_type TEXT DEFAULT 'legacy'
    `);

    await database.run(`
      ALTER TABLE matches ADD COLUMN match_type TEXT DEFAULT 'ranked'
    `);

    await database.run(`
      ALTER TABLE matches ADD COLUMN stability_verified BOOLEAN DEFAULT FALSE
    `);
    
    logger.info('Database migration completed successfully');
    
    // Verify tables were created
    const tables = await database.all(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name NOT LIKE 'sqlite_%'
      ORDER BY name
    `);
    
    logger.info('Created tables:', tables.map(t => t.name));
    
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