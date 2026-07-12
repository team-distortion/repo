/**
 * Authentication middleware
 * Validates JWT tokens and extracts user information
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '@config';
import { JWTPayload } from '@types';
import { ErrorResponses } from '@utils/errors';
import logger from '@utils/logger';

/**
 * Extend Express Request to include user information
 */
declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
      requestId?: string;
    }
  }
}

/**
 * Verify JWT and attach user to request
 */
export function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw ErrorResponses.InvalidOrExpiredToken();
    }

    const token = authHeader.substring(7);

    try {
      const decoded = jwt.verify(token, config.jwt.secret) as JWTPayload;
      req.user = decoded;
      next();
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw ErrorResponses.InvalidOrExpiredToken();
      } else if (error instanceof jwt.JsonWebTokenError) {
        throw ErrorResponses.InvalidOrExpiredToken();
      }
      throw error;
    }
  } catch (error) {
    if ((error as any)?.errorCode) {
      res.status((error as any).statusCode || 401).json({ error });
      return;
    }
    logger.error('Auth middleware error:', error);
    res
      .status(401)
      .json({ error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } });
  }
}

/**
 * Require specific roles
 */
export function requireRole(...allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res
        .status(401)
        .json({ error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        error: {
          code: 'FORBIDDEN',
          message: `This action requires one of the following roles: ${allowedRoles.join(', ')}`,
        },
      });
      return;
    }

    next();
  };
}

/**
 * Optional authentication (doesn't fail if token missing)
 */
export function optionalAuth(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      try {
        const decoded = jwt.verify(token, config.jwt.secret) as JWTPayload;
        req.user = decoded;
      } catch (error) {
        // Silently fail for optional auth
        logger.debug('Optional auth token invalid:', error);
      }
    }

    next();
  } catch (error) {
    logger.error('Optional auth middleware error:', error);
    next();
  }
}

/**
 * Generate JWT token
 */
export function generateToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): string {
  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.expiry as jwt.SignOptions['expiresIn'],
  });
}

/**
 * Generate refresh token
 */
export function generateRefreshToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): string {
  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.refreshExpiry as jwt.SignOptions['expiresIn'],
  });
}
