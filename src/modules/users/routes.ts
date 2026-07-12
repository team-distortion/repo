import { Router, Request, Response, NextFunction } from 'express';
import { query } from '@utils/database';
import { sendSuccess, ErrorResponses } from '@utils/errors';
import { requireRole } from '@middleware';
import { mapRowToEntity, isValidUUID, isValidEmail, isStrongPassword } from '@utils/helpers';
import { buildPaginationMeta, buildLimitOffset, buildOrderByClause } from '@middleware';
import { logActivity } from '@middleware';
import bcrypt from 'bcrypt';

const router = Router();

// GET /
router.get('/', requireRole('Admin', 'AssetManager', 'DepartmentHead'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page, pageSize, offset, sortBy, sortOrder } = req.pagination!;
    const orderClause = buildOrderByClause(sortBy, sortOrder, 'name');
    const limitClause = buildLimitOffset(pageSize, offset);

    const countResult = await query('SELECT COUNT(*) FROM users');
    const totalItems = parseInt(countResult.rows[0].count, 10);

    const result = await query(
      `SELECT id, name, email, department_id, role, status, created_at, updated_at FROM users ${orderClause} ${limitClause}`
    );

    const data = result.rows.map(row => mapRowToEntity(row));
    const meta = buildPaginationMeta(page, pageSize, totalItems);
    sendSuccess(res, data, 200, meta);
  } catch (error) {
    next(error);
  }
});

// GET /:id
router.get('/:id', requireRole('Admin', 'AssetManager', 'DepartmentHead'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    if (!isValidUUID(id)) throw ErrorResponses.BadRequest('Invalid user ID');

    const result = await query('SELECT id, name, email, department_id, role, status, created_at, updated_at FROM users WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      throw ErrorResponses.NotFound('User not found');
    }

    sendSuccess(res, mapRowToEntity(result.rows[0]), 200);
  } catch (error) {
    next(error);
  }
});

// POST /
router.post('/', requireRole('Admin'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, email, password, departmentId, role, status } = req.body;
    
    if (!name) throw ErrorResponses.BadRequest('Name is required');
    if (!email || !isValidEmail(email)) throw ErrorResponses.BadRequest('Valid email is required');
    if (!password || !isStrongPassword(password)) throw ErrorResponses.BadRequest('Strong password is required');
    if (departmentId && !isValidUUID(departmentId)) throw ErrorResponses.BadRequest('Invalid departmentId');
    if (role && !['Employee', 'DepartmentHead', 'AssetManager', 'Admin'].includes(role)) throw ErrorResponses.BadRequest('Invalid role');
    if (status && !['Active', 'Inactive'].includes(status)) throw ErrorResponses.BadRequest('Invalid status');

    const existing = await query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) throw ErrorResponses.BadRequest('Email already registered');

    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);
    
    const roleValue = role || 'Employee';
    const statusValue = status || 'Active';

    const result = await query(
      `INSERT INTO users (name, email, password_hash, department_id, role, status) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, name, email, department_id, role, status, created_at, updated_at`,
      [name, email, passwordHash, departmentId || null, roleValue, statusValue]
    );

    const entity = mapRowToEntity(result.rows[0]);
    if (req.user) {
      logActivity(req, 'UserCreated', 'User', entity.id, { email });
    }
    sendSuccess(res, entity, 201);
  } catch (error) {
    next(error);
  }
});

// PUT /:id
router.put('/:id', requireRole('Admin'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { name, email, password, departmentId, role, status } = req.body;
    
    if (!isValidUUID(id)) throw ErrorResponses.BadRequest('Invalid user ID');
    if (email && !isValidEmail(email)) throw ErrorResponses.BadRequest('Valid email is required');
    if (password && !isStrongPassword(password)) throw ErrorResponses.BadRequest('Strong password is required');
    if (departmentId && !isValidUUID(departmentId)) throw ErrorResponses.BadRequest('Invalid departmentId');
    if (role && !['Employee', 'DepartmentHead', 'AssetManager', 'Admin'].includes(role)) throw ErrorResponses.BadRequest('Invalid role');
    if (status && !['Active', 'Inactive'].includes(status)) throw ErrorResponses.BadRequest('Invalid status');

    const current = await query('SELECT * FROM users WHERE id = $1', [id]);
    if (current.rows.length === 0) throw ErrorResponses.NotFound('User not found');

    if (email && email !== current.rows[0].email) {
      const existing = await query('SELECT id FROM users WHERE email = $1 AND id != $2', [email, id]);
      if (existing.rows.length > 0) throw ErrorResponses.BadRequest('Email already registered');
    }

    const updatedName = name || current.rows[0].name;
    const updatedEmail = email || current.rows[0].email;
    const updatedDepartmentId = departmentId !== undefined ? departmentId : current.rows[0].department_id;
    const updatedRole = role || current.rows[0].role;
    const updatedStatus = status || current.rows[0].status;
    
    let updatedPasswordHash = current.rows[0].password_hash;
    if (password) {
      updatedPasswordHash = await bcrypt.hash(password, 10);
    }

    const result = await query(
      `UPDATE users SET name = $1, email = $2, password_hash = $3, department_id = $4, role = $5, status = $6 WHERE id = $7 RETURNING id, name, email, department_id, role, status, created_at, updated_at`,
      [updatedName, updatedEmail, updatedPasswordHash, updatedDepartmentId || null, updatedRole, updatedStatus, id]
    );

    const entity = mapRowToEntity(result.rows[0]);
    if (req.user) {
      logActivity(req, 'UserUpdated', 'User', entity.id, { email: updatedEmail });
    }
    sendSuccess(res, entity, 200);
  } catch (error) {
    next(error);
  }
});

// DELETE /:id
router.delete('/:id', requireRole('Admin'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    if (!isValidUUID(id)) throw ErrorResponses.BadRequest('Invalid user ID');

    // Make sure we're not deleting ourselves
    if (req.user && req.user.id === id) {
      throw ErrorResponses.BadRequest('Cannot delete your own account');
    }

    const current = await query('SELECT id FROM users WHERE id = $1', [id]);
    if (current.rows.length === 0) throw ErrorResponses.NotFound('User not found');

    try {
      await query('DELETE FROM users WHERE id = $1', [id]);
      if (req.user) {
        logActivity(req, 'UserDeleted', 'User', id, {});
      }
      sendSuccess(res, { message: 'User deleted successfully' }, 200);
    } catch (dbError: any) {
      // If restricted by FK
      if (dbError.code === '23503') { // foreign_key_violation
        throw ErrorResponses.BadRequest('Cannot delete user because they are referenced by other records (e.g., allocations). Consider setting their status to Inactive instead.');
      }
      throw dbError;
    }
  } catch (error) {
    next(error);
  }
});

export default router;
