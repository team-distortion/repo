/**
 * AssetFlow Backend - Main Entry Point
 */

import { config, validateConfig } from '@config';
import { initializeDatabase, closeDatabase } from '@utils/database';
import logger from '@utils/logger';
import { createApp } from './app';

/**
 * Start the application
 */
async function start(): Promise<void> {
  try {
    // Validate configuration
    validateConfig();

    // Initialize database
    logger.info('Initializing database connection...');
    initializeDatabase();

    // Create Express app
    const app = createApp();

    // Start server
    const server = app.listen(config.app.port, config.app.host, () => {
      logger.info(
        `🚀 AssetFlow backend running on http://${config.app.host}:${config.app.port}`,
        {
          environment: config.app.env,
          database: `${config.database.user}@${config.database.host}:${config.database.port}/${config.database.name}`,
        }
      );
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
      logger.info('SIGTERM signal received: closing HTTP server');
      server.close(async () => {
        logger.info('HTTP server closed');
        await closeDatabase();
        process.exit(0);
      });
    });

    process.on('SIGINT', () => {
      logger.info('SIGINT signal received: closing HTTP server');
      server.close(async () => {
        logger.info('HTTP server closed');
        await closeDatabase();
        process.exit(0);
      });
    });

    process.on('uncaughtException', (error) => {
      logger.error('Uncaught exception:', error);
      process.exit(1);
    });

    process.on('unhandledRejection', (reason) => {
      logger.error('Unhandled rejection:', reason);
      process.exit(1);
    });
  } catch (error) {
    logger.error('Failed to start application:', error);
    process.exit(1);
  }
}

start();
