/**
 * Express application setup and routing
 */

import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import bodyParser from 'body-parser';
import { config } from '@config';
import {
  authMiddleware,
  paginationMiddleware,
  requestLogger,
  errorHandler,
  notFoundHandler,
} from '@middleware';
import logger from '@utils/logger';

export function createApp(): Express {
  const app = express();

  // ==================== Security Middleware ====================
  app.use(helmet());
  app.use(
    cors({
      origin: config.cors.origin,
      credentials: config.cors.credentials,
      optionsSuccessStatus: 200,
    })
  );

  // ==================== Compression & Parsing ====================
  app.use(compression());
  app.use(bodyParser.json({ limit: '10mb' }));
  app.use(bodyParser.urlencoded({ limit: '10mb', extended: true }));

  // ==================== Logging ====================
  app.use(requestLogger);

  // ==================== Rate Limiting ====================
  const limiter = rateLimit({
    windowMs: config.rateLimit.windowMs,
    max: config.rateLimit.maxRequests,
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
  });
  app.use('/api/', limiter);

  // ==================== Health Check ====================
  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // ==================== API Routes ====================
  // Public routes (no auth required)
  app.use('/api/auth', require('@modules/auth/routes').default);

  // Protected routes (auth required)
  app.use('/api/users', authMiddleware, paginationMiddleware, require('@modules/users/routes').default);
  app.use('/api/departments', authMiddleware, paginationMiddleware, require('@modules/departments/routes').default);
  app.use('/api/categories', authMiddleware, paginationMiddleware, require('@modules/categories/routes').default);
  app.use('/api/assets', authMiddleware, paginationMiddleware, require('@modules/assets/routes').default);
  app.use('/api/allocations', authMiddleware, paginationMiddleware, require('@modules/allocations/routes').default);
  app.use('/api/transfers', authMiddleware, paginationMiddleware, require('@modules/transfers/routes').default);
  app.use('/api/bookings', authMiddleware, paginationMiddleware, require('@modules/bookings/routes').default);
  app.use('/api/maintenance', authMiddleware, paginationMiddleware, require('@modules/maintenance/routes').default);
  app.use('/api/audits', authMiddleware, paginationMiddleware, require('@modules/audits/routes').default);
  app.use('/api/dashboard', authMiddleware, require('@modules/dashboard/routes').default);
  app.use('/api/reports', authMiddleware, paginationMiddleware, require('@modules/reports/routes').default);
  app.use('/api/notifications', authMiddleware, require('@modules/notifications/routes').default);
  app.use('/api/activity-logs', authMiddleware, paginationMiddleware, require('@modules/activityLogs/routes').default);

  // ==================== Error Handling ====================
  app.use(notFoundHandler);
  app.use(errorHandler);

  logger.info('Express application configured');

  return app;
}
