/**
 * Activity logging middleware and utilities
 * Tracks all state-changing operations for audit trail
 */

import { Request, Response, NextFunction } from 'express';
import { PoolClient } from 'pg';
import { ActivityAction } from '@types';
import logger from '@utils/logger';
import { v4 as uuidv4 } from 'uuid';

declare global {
  namespace Express {
    interface Request {
      activityLog?: {
        action?: ActivityAction;
        entityType?: string;
        entityId?: string;
        changes?: Record<string, any>;
      };
    }
  }
}

/**
 * Request logging middleware
 */
export function requestLogger(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const startTime = Date.now();
  const requestId = req.headers['x-request-id'] as string || uuidv4();
  req.requestId = requestId;

  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const level =
      res.statusCode >= 500
        ? 'error'
        : res.statusCode >= 400
        ? 'warn'
        : 'info';

    const logData = {
      requestId,
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration: `${duration}ms`,
      userId: req.user?.userId,
      ip: req.ip,
    };

    if (level === 'error') {
      logger.error(`${req.method} ${req.path}`, undefined, logData);
    } else if (level === 'warn') {
      logger.warn(`${req.method} ${req.path}`, logData);
    } else {
      logger.info(`${req.method} ${req.path}`, logData);
    }
  });

  next();
}

/**
 * Log activity to database
 * Called after successful state-changing operations
 */
export async function logActivity(
  client: PoolClient,
  action: string,
  targetEntity: string,
  targetId: string,
  userId: string,
  metadata?: Record<string, any>
): Promise<void> {
  const { config } = require('@config');
  if (!config.features.enableActivityLogging) {
    return;
  }

  const sql = `
    INSERT INTO activity_logs (user_id, action, target_entity, target_id, metadata)
    VALUES ($1, $2, $3, $4, $5)
  `;

  const params = [
    userId,
    action,
    targetEntity,
    targetId,
    JSON.stringify(metadata || {}),
  ];

  try {
    await client.query(sql, params);
    logger.debug('Activity logged', { action, targetEntity, targetId });
  } catch (error) {
    logger.error('Failed to log activity', error, {
      action,
      targetEntity,
      targetId,
    });
    // Don't throw - activity logging should not fail the main operation
  }
}

/**
 * Build activity log entry for success response
 * Attach to request for after-response logging
 */
export function setActivityLog(
  req: Request,
  action: ActivityAction,
  entityType: string,
  entityId: string,
  changes?: Record<string, any>
): void {
  if (!req.activityLog) {
    req.activityLog = {};
  }

  req.activityLog.action = action;
  req.activityLog.entityType = entityType;
  req.activityLog.entityId = entityId;
  req.activityLog.changes = changes;
}
