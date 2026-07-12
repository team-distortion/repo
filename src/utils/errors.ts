/**
 * Response formatting and error handling utilities
 */

import { Response } from 'express';
import { ApiResponse, ApiError, ErrorResponse, PaginationMeta } from '@types';

/**
 * Standard API success response
 */
export function sendSuccess<T>(
  res: Response,
  data: T,
  statusCode: number = 200,
  pagination?: PaginationMeta
): Response {
  const response: ApiResponse<T> = {
    data,
    ...(pagination && { pagination }),
  };

  return res.status(statusCode).json(response);
}

/**
 * Standard API error response
 */
export function sendError(
  res: Response,
  statusCode: number,
  code: string,
  message: string,
  details?: any
): Response {
  const error: ApiError = {
    code,
    message,
    ...(details && { details }),
  };

  const response: ErrorResponse = { error };

  return res.status(statusCode).json(response);
}

/**
 * API Error class with status code
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly errorCode: string;
  public readonly details?: any;

  constructor(
    statusCode: number,
    errorCode: string,
    message: string,
    details?: any
  ) {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.details = details;
    Object.setPrototypeOf(this, AppError.prototype);
  }

  static badRequest(code: string, message: string, details?: any): AppError {
    return new AppError(400, code, message, details);
  }

  static unauthorized(message: string = 'Unauthorized'): AppError {
    return new AppError(401, 'UNAUTHORIZED', message);
  }

  static forbidden(message: string = 'Forbidden'): AppError {
    return new AppError(403, 'FORBIDDEN', message);
  }

  static notFound(message: string, details?: any): AppError {
    return new AppError(404, 'NOT_FOUND', message, details);
  }

  static conflict(code: string, message: string, details?: any): AppError {
    return new AppError(409, code, message, details);
  }

  static unprocessable(code: string, message: string, details?: any): AppError {
    return new AppError(422, code, message, details);
  }

  static tooManyRequests(message: string = 'Too many requests'): AppError {
    return new AppError(429, 'TOO_MANY_REQUESTS', message);
  }

  static internal(message: string = 'Internal server error'): AppError {
    return new AppError(500, 'INTERNAL_ERROR', message);
  }
}

/**
 * Common error responses
 */
export const ErrorResponses = {
  // 400 - Validation & Bad Request
  ValidationError: (details?: any) =>
    AppError.badRequest('VALIDATION_ERROR', 'Invalid request data', details),

  InvalidEmail: () =>
    AppError.badRequest('INVALID_EMAIL', 'Invalid email format'),

  WeakPassword: () =>
    AppError.badRequest('WEAK_PASSWORD', 'Password does not meet complexity requirements'),

  InvalidDate: (message: string = 'Invalid date value') =>
    AppError.badRequest('INVALID_DATE', message),

  InvalidStatus: (validStatuses: string[]) =>
    AppError.badRequest(
      'INVALID_STATUS',
      `Status must be one of: ${validStatuses.join(', ')}`
    ),

  InvalidTransition: (from: string, to: string) =>
    AppError.badRequest(
      'INVALID_TRANSITION',
      `Cannot transition from ${from} to ${to}`
    ),

  // 401 - Authentication
  InvalidCredentials: () =>
    AppError.unauthorized('Invalid email or password'),

  AccountInactive: () =>
    AppError.unauthorized('Account is inactive or suspended'),

  InvalidOrExpiredToken: () =>
    AppError.unauthorized('Token is invalid or expired'),

  // 403 - Authorization
  InsufficientPermissions: () =>
    AppError.forbidden('You do not have permission to perform this action'),

  // 404 - Not Found
  NotFound: (entityName: string) =>
    AppError.notFound(`${entityName} not found`),

  AssetNotFound: () =>
    AppError.notFound('Asset not found'),

  UserNotFound: () =>
    AppError.notFound('User not found'),

  DepartmentNotFound: () =>
    AppError.notFound('Department not found'),

  CategoryNotFound: () =>
    AppError.notFound('Category not found'),

  AllocationNotFound: () =>
    AppError.notFound('Allocation not found'),

  TransferNotFound: () =>
    AppError.notFound('Transfer not found'),

  BookingNotFound: () =>
    AppError.notFound('Booking not found'),

  MaintenanceNotFound: () =>
    AppError.notFound('Maintenance request not found'),

  AuditNotFound: () =>
    AppError.notFound('Audit cycle not found'),

  // 409 - Conflict
  DuplicateEmail: () =>
    AppError.conflict('DUPLICATE_EMAIL', 'Email already registered'),

  DuplicateName: (entityName: string) =>
    AppError.conflict('DUPLICATE_NAME', `${entityName} name already exists`),

  DuplicateSerialNumber: () =>
    AppError.conflict('DUPLICATE_SERIAL', 'Serial number already exists for this category'),

  AssetAlreadyAllocated: (details?: any) =>
    AppError.conflict('ASSET_ALREADY_ALLOCATED', 'Asset is already allocated', details),

  AssetNotBookable: () =>
    AppError.conflict('ASSET_NOT_BOOKABLE', 'Asset is not bookable'),

  BookingOverlap: (details?: any) =>
    AppError.conflict('BOOKING_OVERLAP', 'Requested time slot conflicts with existing booking', details),

  CircularHierarchy: () =>
    AppError.conflict('CIRCULAR_HIERARCHY', 'This would create a circular department hierarchy'),

  VersionConflict: (expectedVersion: number, currentVersion: number) =>
    AppError.conflict(
      'VERSION_CONFLICT',
      'Resource was modified since your last read',
      { expectedVersion, currentVersion }
    ),

  // 422 - Unprocessable
  InvalidManualTransition: () =>
    AppError.unprocessable(
      'INVALID_MANUAL_TRANSITION',
      'System-driven status transitions cannot be set manually'
    ),

  InvalidStateTransition: (code: string, message: string) =>
    AppError.unprocessable(code, message),

  AuditClosed: () =>
    AppError.unprocessable('AUDIT_CLOSED', 'Audit cycle is closed; no further edits allowed'),

  // 429 - Rate Limit
  TooManyRequests: () =>
    AppError.tooManyRequests(),

  // 500 - Server Error
  InternalError: (details?: string) =>
    AppError.internal(details || 'An unexpected error occurred'),
};
