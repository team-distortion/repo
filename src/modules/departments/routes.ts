import { Router, Request, Response, NextFunction } from 'express';
import { query } from '@utils/database';
import { sendSuccess, ErrorResponses } from '@utils/errors';
import { requireRole } from '@middleware';
import { mapRowToEntity, isValidUUID } from '@utils/helpers';
import { buildPaginationMeta, buildLimitOffset, buildOrderByClause } from '@middleware';
import { logActivity } from '@middleware';

const router = Router();

// GET /
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page, pageSize, offset, sortBy, sortOrder } = req.pagination!;
    const orderClause = buildOrderByClause(sortBy, sortOrder, 'name');
    const limitClause = buildLimitOffset(pageSize, offset);

    const countResult = await query('SELECT COUNT(*) FROM departments');
    const totalItems = parseInt(countResult.rows[0].count, 10);

    const result = await query(
      `SELECT * FROM departments ${orderClause} ${limitClause}`
    );

    const data = result.rows.map(row => mapRowToEntity(row));
    const meta = buildPaginationMeta(page, pageSize, totalItems);
    sendSuccess(res, data, 200, meta);
  } catch (error) {
    next(error);
  }
});

// GET /:id
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    if (!isValidUUID(id)) throw ErrorResponses.ValidationError('Invalid department ID');

    const result = await query('SELECT * FROM departments WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      throw ErrorResponses.NotFound('Department not found');
    }

    sendSuccess(res, mapRowToEntity(result.rows[0]), 200);
  } catch (error) {
    next(error);
  }
});

// POST /
router.post('/', requireRole('Admin'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, parentId, headUserId, status } = req.body;
    if (!name) throw ErrorResponses.ValidationError('Name is required');
    if (parentId && !isValidUUID(parentId)) throw ErrorResponses.ValidationError('Invalid parentId');
    if (headUserId && !isValidUUID(headUserId)) throw ErrorResponses.ValidationError('Invalid headUserId');
    if (status && !['Active', 'Inactive'].includes(status)) throw ErrorResponses.ValidationError('Invalid status');

    const existing = await query('SELECT id FROM departments WHERE name = $1', [name]);
    if (existing.rows.length > 0) throw ErrorResponses.ValidationError('Department name already exists');

    const statusValue = status || 'Active';
    const result = await query(
      `INSERT INTO departments (name, parent_id, head_user_id, status) VALUES ($1, $2, $3, $4) RETURNING *`,
      [name, parentId || null, headUserId || null, statusValue]
    );

    const entity = mapRowToEntity(result.rows[0]);
    if (req.user) {
      logActivity(require('@utils/database').getPool(), 'DepartmentCreated', 'Department', (entity as any).id, req.user.userId, { name });
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
    const { name, parentId, headUserId, status } = req.body;
    
    if (!isValidUUID(id)) throw ErrorResponses.ValidationError('Invalid department ID');
    if (parentId && !isValidUUID(parentId)) throw ErrorResponses.ValidationError('Invalid parentId');
    if (headUserId && !isValidUUID(headUserId)) throw ErrorResponses.ValidationError('Invalid headUserId');
    if (status && !['Active', 'Inactive'].includes(status)) throw ErrorResponses.ValidationError('Invalid status');

    if (id === parentId) throw ErrorResponses.ValidationError('Department cannot be its own parent');

    const current = await query('SELECT * FROM departments WHERE id = $1', [id]);
    if (current.rows.length === 0) throw ErrorResponses.NotFound('Department not found');

    if (name && name !== current.rows[0].name) {
      const existing = await query('SELECT id FROM departments WHERE name = $1 AND id != $2', [name, id]);
      if (existing.rows.length > 0) throw ErrorResponses.ValidationError('Department name already exists');
    }

    const updatedName = name || current.rows[0].name;
    const updatedParentId = parentId !== undefined ? parentId : current.rows[0].parent_id;
    const updatedHeadUserId = headUserId !== undefined ? headUserId : current.rows[0].head_user_id;
    const updatedStatus = status || current.rows[0].status;

    const result = await query(
      `UPDATE departments SET name = $1, parent_id = $2, head_user_id = $3, status = $4 WHERE id = $5 RETURNING *`,
      [updatedName, updatedParentId || null, updatedHeadUserId || null, updatedStatus, id]
    );

    const entity = mapRowToEntity(result.rows[0]);
    if (req.user) {
      logActivity(require('@utils/database').getPool(), 'DepartmentUpdated', 'Department', (entity as any).id, req.user.userId, { name: updatedName });
    }
    sendSuccess(res, entity, 200);
  } catch (error) {
    next(error);
  }
});

export default router;
