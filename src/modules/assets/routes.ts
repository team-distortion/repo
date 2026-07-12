import { Router, Request, Response, NextFunction } from 'express';
import { query } from '@utils/database';
import { sendSuccess, AppError, ErrorResponses } from '@utils/errors';
import { requireRole, buildPaginationMeta, buildLimitOffset, buildOrderByClause, logActivity } from '@middleware';

const router = Router();

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page = 1, pageSize = 10, sortBy = 'created_at', sortOrder = 'desc' } = req.query;
    const { limit, offset } = buildLimitOffset(Number(page), Number(pageSize));
    const orderBy = buildOrderByClause(String(sortBy), String(sortOrder));

    const countRes = await query('SELECT COUNT(*) FROM assets');
    const totalItems = parseInt(countRes.rows[0].count, 10);

    const result = await query(
      `SELECT * FROM assets ${orderBy} LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    const pagination = buildPaginationMeta(totalItems, Number(page), Number(pageSize));
    sendSuccess(res, result.rows, 200, pagination);
  } catch (err) {
    next(err);
  }
});

router.post('/', requireRole('Admin', 'AssetManager'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, categoryId, serialNumber, acquisitionDate, acquisitionCost, condition, location, isShared, status } = req.body;
    
    // Minimal validation
    if (!name || !categoryId || !location) {
      throw ErrorResponses.badRequest('Missing required fields');
    }

    const assetTag = 'AF-' + Math.floor(Math.random() * 1000000).toString().padStart(6, '0');

    const result = await query(
      `INSERT INTO assets (asset_tag, name, category_id, serial_number, acquisition_date, acquisition_cost, condition, location, is_shared, status) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
      [assetTag, name, categoryId, serialNumber, acquisitionDate, acquisitionCost, condition || 'Good', location, isShared || false, status || 'Available']
    );

    const asset = result.rows[0];
    await logActivity(req, 'AssetCreated', 'Asset', asset.id, { assetTag: asset.asset_tag });
    
    sendSuccess(res, asset, 201);
  } catch (err) {
    next(err);
  }
});

router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await query('SELECT * FROM assets WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) throw ErrorResponses.notFound('Asset not found');
    sendSuccess(res, result.rows[0]);
  } catch (err) {
    next(err);
  }
});

router.put('/:id', requireRole('Admin', 'AssetManager'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, condition, location, isShared } = req.body;
    const result = await query(
      `UPDATE assets SET name = COALESCE($1, name), condition = COALESCE($2, condition), 
       location = COALESCE($3, location), is_shared = COALESCE($4, is_shared), updated_at = now() 
       WHERE id = $5 RETURNING *`,
      [name, condition, location, isShared, req.params.id]
    );
    if (result.rows.length === 0) throw ErrorResponses.notFound('Asset not found');
    
    await logActivity(req, 'AssetUpdated', 'Asset', req.params.id, { updates: req.body });
    sendSuccess(res, result.rows[0]);
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', requireRole('Admin', 'AssetManager'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await query('DELETE FROM assets WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) throw ErrorResponses.notFound('Asset not found');
    
    await logActivity(req, 'AssetDeleted', 'Asset', req.params.id);
    sendSuccess(res, { message: 'Asset deleted successfully' });
  } catch (err) {
    next(err);
  }
});

router.patch('/:id/status', requireRole('Admin', 'AssetManager'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status } = req.body;
    const result = await query('UPDATE assets SET status = $1, updated_at = now() WHERE id = $2 RETURNING *', [status, req.params.id]);
    if (result.rows.length === 0) throw ErrorResponses.notFound('Asset not found');
    
    await logActivity(req, 'AssetStatusChanged', 'Asset', req.params.id, { status });
    sendSuccess(res, result.rows[0]);
  } catch (err) {
    next(err);
  }
});

export default router;
