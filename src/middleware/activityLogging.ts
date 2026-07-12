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
  action: ActivityAction,
  entityType: string,
  entityId: string,
  userId: string,
  userName: string,
  userRole: string,
  changes?: Record<string, any>,
  ipAddress?: string,
  userAgent?: string
): Promise<void> {
  if (!process.env.ENABLE_ACTIVITY_LOGGING || process.env.ENABLE_ACTIVITY_LOGGING !== 'true') {
    return;
  }

  const logId = uuidv4();
  const timestamp = new Date();

  const sql = `
    INSERT INTO activity_log (
      logId, actor_userId, actor_name, actor_role, action, 
      entityType, entityId, changes, timestamp, ipAddress, userAgent
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
  `;

  const params = [
    logId,
    userId,
    userName,
    userRole,
    action,
    entityType,
    entityId,
    JSON.stringify(changes || {}),
    timestamp,
    ipAddress || null,
    userAgent || null,
  ];

  try {
    await client.query(sql, params);
    logger.debug('Activity logged', { action, entityType, entityId });
  } catch (error) {
    logger.error('Failed to log activity', error, {
      action,
      entityType,
      entityId,
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
