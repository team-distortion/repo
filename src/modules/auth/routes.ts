/**
 * Authentication Routes
 * Endpoints: POST /api/auth/signup, /login, /forgot-password, etc.
 */

import { Router, Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { query, transaction } from '@utils/database';
import { sendSuccess, ErrorResponses } from '@utils/errors';
import { generateToken, generateRefreshToken, authMiddleware } from '@middleware';
import { logActivity } from '@middleware';
import logger from '@utils/logger';

const router = Router();

/**
 * Map DB user to camelCase object
 */
function mapUser(row: any) {
  return {
    userId: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    departmentId: row.department_id,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    version: row.version,
  };
}

/**
 * POST /api/auth/signup
 * Create new user account (Employee role only)
 */
router.post('/signup', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, email, password, departmentId } = req.body;

    if (!name || !email || !password) {
      throw ErrorResponses.ValidationError('Missing required fields: name, email, or password');
    }

    if (password.length < 8) {
      throw ErrorResponses.WeakPassword();
    }

    // Check for duplicate email
    const existingUser = await query('SELECT id FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      throw ErrorResponses.DuplicateEmail();
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    
    // Insert into users table
    const result = await transaction(async (client) => {
      const sql = `
        INSERT INTO users (name, email, password_hash, role, department_id, status)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `;
      const params = [name, email, hashedPassword, 'Employee', departmentId || null, 'Active'];
      const { rows } = await client.query(sql, params);
      
      const userRow = rows[0];
      
      // Log activity
      await logActivity(
        client,
        'UserCreated',
        'User',
        userRow.id,
        userRow.id,
        { name: userRow.name, email: userRow.email }
      );
      
      return userRow;
    });

    const userResponse = mapUser(result);
    sendSuccess(res, userResponse, 201);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/auth/login
 * Authenticate user and return JWT token
 */
router.post('/login', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      throw ErrorResponses.ValidationError('Email and password are required');
    }

    const { rows } = await query('SELECT * FROM users WHERE email = $1', [email]);
    
    if (rows.length === 0) {
      throw ErrorResponses.InvalidCredentials();
    }
    
    const user = rows[0];
    
    if (user.status !== 'Active') {
      throw ErrorResponses.AccountInactive();
    }
    
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      throw ErrorResponses.InvalidCredentials();
    }
    
    const payload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      departmentId: user.department_id,
    };
    
    const token = generateToken(payload);
    const refreshToken = generateRefreshToken(payload);
    
    const userResponse = mapUser(user);
    
    sendSuccess(res, { token, refreshToken, user: userResponse }, 200);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/auth/forgot-password
 */
router.post('/forgot-password', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email } = req.body;
    if (!email) {
      throw ErrorResponses.ValidationError('Email is required');
    }
    
    const { rows } = await query('SELECT id, status FROM users WHERE email = $1', [email]);
    
    if (rows.length === 0) {
      sendSuccess(res, { message: 'If an account with that email exists, a reset link has been sent' }, 200);
      return;
    }
    
    const user = rows[0];
    
    if (user.status !== 'Active') {
      sendSuccess(res, { message: 'If an account with that email exists, a reset link has been sent' }, 200);
      return;
    }
    
    const resetToken = crypto.randomUUID();
    const hashedToken = await bcrypt.hash(resetToken, 12);
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
    
    await transaction(async (client) => {
      await client.query(`
        INSERT INTO password_reset_tokens (user_id, token_hash, expires_at)
        VALUES ($1, $2, $3)
      `, [user.id, hashedToken, expiresAt]);
      
      logger.info(`Password reset requested for user ${user.id}. Token: ${resetToken}`);
    });
    
    sendSuccess(res, { message: 'If an account with that email exists, a reset link has been sent' }, 200);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/auth/reset-password
 */
router.post('/reset-password', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { token, email, newPassword } = req.body;
    
    if (!token || !email || !newPassword) {
      throw ErrorResponses.ValidationError('Token, email, and newPassword are required');
    }
    
    if (newPassword.length < 8) {
      throw ErrorResponses.WeakPassword();
    }
    
    const userResult = await query('SELECT id FROM users WHERE email = $1 AND status = $2', [email, 'Active']);
    
    if (userResult.rows.length === 0) {
      throw ErrorResponses.InvalidCredentials();
    }
    
    const userId = userResult.rows[0].id;
    
    const tokensResult = await query(`
      SELECT id, token_hash 
      FROM password_reset_tokens 
      WHERE user_id = $1 AND used_at IS NULL AND expires_at > NOW()
    `, [userId]);
    
    if (tokensResult.rows.length === 0) {
      throw ErrorResponses.InvalidOrExpiredToken();
    }
    
    let matchedTokenId = null;
    for (const row of tokensResult.rows) {
      const isMatch = await bcrypt.compare(token, row.token_hash);
      if (isMatch) {
        matchedTokenId = row.id;
        break;
      }
    }
    
    if (!matchedTokenId) {
      throw ErrorResponses.InvalidOrExpiredToken();
    }
    
    const hashedNewPassword = await bcrypt.hash(newPassword, 12);
    
    await transaction(async (client) => {
      await client.query('UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2', [hashedNewPassword, userId]);
      await client.query('UPDATE password_reset_tokens SET used_at = NOW() WHERE id = $1', [matchedTokenId]);
      
      await logActivity(
        client,
        'UserUpdated',
        'User',
        userId,
        userId,
        { field: 'password' }
      );
    });
    
    sendSuccess(res, { message: 'Password reset successfully' }, 200);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/auth/me
 * Get current user profile
 */
router.get('/me', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    
    if (!userId) {
      throw ErrorResponses.InvalidOrExpiredToken();
    }
    
    const { rows } = await query('SELECT * FROM users WHERE id = $1', [userId]);
    
    if (rows.length === 0) {
      throw ErrorResponses.UserNotFound();
    }
    
    const userResponse = mapUser(rows[0]);
    
    sendSuccess(res, { user: userResponse }, 200);
  } catch (error) {
    next(error);
  }
});

export default router;
