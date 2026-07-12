/**
 * Pagination utilities and middleware
 */

import { Request, Response, NextFunction } from 'express';
import { PaginationMeta } from '@types';

export interface PaginationParams {
  page: number;
  pageSize: number;
  offset: number;
  sortBy?: string;
  sortOrder: 'asc' | 'desc';
}

declare global {
  namespace Express {
    interface Request {
      pagination?: PaginationParams;
    }
  }
}

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

/**
 * Extract pagination params from query
 */
export function extractPaginationParams(req: Request): PaginationParams {
  const page = Math.max(1, parseInt(req.query.page as string) || DEFAULT_PAGE);
  const pageSize = Math.min(
    MAX_PAGE_SIZE,
    Math.max(1, parseInt(req.query.pageSize as string) || DEFAULT_PAGE_SIZE)
  );
  const sortBy = (req.query.sortBy as string) || undefined;
  const sortOrder = (['asc', 'desc'].includes(req.query.sortOrder as string)
    ? req.query.sortOrder
    : 'desc') as 'asc' | 'desc';

  return {
    page,
    pageSize,
    offset: (page - 1) * pageSize,
    sortBy,
    sortOrder,
  };
}

/**
 * Middleware to attach pagination params to request
 */
export function paginationMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  req.pagination = extractPaginationParams(req);
  next();
}

/**
 * Build pagination meta from results
 */
export function buildPaginationMeta(
  page: number,
  pageSize: number,
  totalItems: number
): PaginationMeta {
  const totalPages = Math.ceil(totalItems / pageSize);

  return {
    page,
    pageSize,
    totalItems,
    totalPages,
  };
}

/**
 * Build SQL LIMIT/OFFSET clause
 */
export function buildLimitOffset(pageSize: number, offset: number): string {
  return `LIMIT ${pageSize} OFFSET ${offset}`;
}

/**
 * Build SQL ORDER BY clause
 */
export function buildOrderByClause(
  sortBy?: string,
  sortOrder: 'asc' | 'desc' = 'desc',
  defaultField: string = 'created_at'
): string {
  // Sanitize sortBy to prevent SQL injection (whitelist validation)
  const allowedFields = /^[a-zA-Z_][a-zA-Z0-9_]*$/;
  const field =
    sortBy && allowedFields.test(sortBy) ? sortBy : defaultField;

  return `ORDER BY ${field} ${sortOrder.toUpperCase()}`;
}
