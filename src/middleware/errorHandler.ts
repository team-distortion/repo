/**
 * Global error handling middleware
 */

import { Request, Response, NextFunction } from 'express';
import { AppError, sendError } from '@utils/errors';
import logger from '@utils/logger';

export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  logger.error(
    'Error occurred',
    err,
    { path: req.path, method: req.method, user: req.user?.userId }
  );

  if (err instanceof AppError) {
    sendError(res, err.statusCode, err.errorCode, err.message, err.details);
    return;
  }

  // Handle database errors
  if (err.code === '23505') {
    // Unique constraint violation
    sendError(res, 409, 'DUPLICATE_ENTRY', 'This entry already exists');
    return;
  }

  if (err.code === '23503') {
    // Foreign key constraint violation
    sendError(res, 400, 'INVALID_REFERENCE', 'Referenced entity does not exist');
    return;
  }

  if (err.code === '42P01') {
    // Undefined table
    logger.error('Database schema issue:', err);
    sendError(res, 500, 'DATABASE_ERROR', 'Database schema issue');
    return;
  }

  // Fallback to generic error
  sendError(
    res,
    500,
    'INTERNAL_ERROR',
    'An unexpected error occurred'
  );
}

/**
 * 404 handler
 */
export function notFoundHandler(
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  sendError(res, 404, 'NOT_FOUND', `Endpoint ${req.method} ${req.path} not found`);
}
