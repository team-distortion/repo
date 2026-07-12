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

    const countResult = await query('SELECT COUNT(*) FROM categories');
    const totalItems = parseInt(countResult.rows[0].count, 10);

    const result = await query(
      `SELECT * FROM categories ${orderClause} ${limitClause}`
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
    if (!isValidUUID(id)) throw ErrorResponses.BadRequest('Invalid category ID');

    const result = await query('SELECT * FROM categories WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      throw ErrorResponses.NotFound('Category not found');
    }

    sendSuccess(res, mapRowToEntity(result.rows[0]), 200);
  } catch (error) {
    next(error);
  }
});

// POST /
router.post('/', requireRole('Admin', 'AssetManager'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, customFields } = req.body;
    if (!name) throw ErrorResponses.BadRequest('Name is required');

    const existing = await query('SELECT id FROM categories WHERE name = $1', [name]);
    if (existing.rows.length > 0) throw ErrorResponses.BadRequest('Category name already exists');

    const customFieldsJson = customFields ? JSON.stringify(customFields) : null;
    const result = await query(
      `INSERT INTO categories (name, custom_fields) VALUES ($1, $2) RETURNING *`,
      [name, customFieldsJson]
    );

    const entity = mapRowToEntity(result.rows[0]);
    if (req.user) {
      logActivity(req, 'CategoryCreated', 'Category', entity.id, { name });
    }
    sendSuccess(res, entity, 201);
  } catch (error) {
    next(error);
  }
});

// PUT /:id
router.put('/:id', requireRole('Admin', 'AssetManager'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { name, customFields } = req.body;
    if (!isValidUUID(id)) throw ErrorResponses.BadRequest('Invalid category ID');

    const current = await query('SELECT * FROM categories WHERE id = $1', [id]);
    if (current.rows.length === 0) throw ErrorResponses.NotFound('Category not found');

    if (name && name !== current.rows[0].name) {
      const existing = await query('SELECT id FROM categories WHERE name = $1 AND id != $2', [name, id]);
      if (existing.rows.length > 0) throw ErrorResponses.BadRequest('Category name already exists');
    }

    const updatedName = name || current.rows[0].name;
    const customFieldsJson = customFields !== undefined ? JSON.stringify(customFields) : current.rows[0].custom_fields;

    const result = await query(
      `UPDATE categories SET name = $1, custom_fields = $2 WHERE id = $3 RETURNING *`,
      [updatedName, customFieldsJson, id]
    );

    const entity = mapRowToEntity(result.rows[0]);
    if (req.user) {
      logActivity(req, 'CategoryUpdated', 'Category', entity.id, { name: updatedName });
    }
    sendSuccess(res, entity, 200);
  } catch (error) {
    next(error);
  }
});

export default router;
