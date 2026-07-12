import fs from 'fs';
import path from 'path';
import { initializeDatabase, query, closeDatabase } from '../../utils/database';
import logger from '../../utils/logger';

async function runMigrations() {
  const isFresh = process.argv.includes('--fresh');

  try {
    initializeDatabase();

    if (isFresh) {
      logger.info('Dropping public schema (--fresh flag provided)...');
      await query('DROP SCHEMA public CASCADE;');
      await query('CREATE SCHEMA public;');
      await query('GRANT ALL ON SCHEMA public TO public;');
      logger.info('Public schema recreated.');
    }

    const schemaPath = path.join(__dirname, '../schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf-8');

    logger.info('Executing schema.sql...');
    await query(schemaSql);

    logger.info('Migration completed successfully.');
  } catch (error) {
    logger.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await closeDatabase();
  }
}

runMigrations();
