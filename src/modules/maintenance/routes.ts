import { Router, Request, Response, NextFunction } from 'express';
import { query, transaction } from '@utils/database';
import { sendSuccess, AppError, ErrorResponses } from '@utils/errors';
import { requireRole, buildPaginationMeta, buildLimitOffset, logActivity } from '@middleware';

const router = Router();

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page = 1, pageSize = 10 } = req.query;
    const limit = Number(pageSize) || 10;
    const offset = (Number(page) - 1) * limit;
    const countRes = await query('SELECT COUNT(*) FROM maintenance_requests');
    const result = await query('SELECT * FROM maintenance_requests ORDER BY created_at DESC LIMIT $1 OFFSET $2', [limit, offset]);
    sendSuccess(res, result.rows, 200, buildPaginationMeta(Number(page), limit, parseInt(countRes.rows[0].count)));
  } catch (err) { next(err); }
});

router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await query('SELECT * FROM maintenance_requests WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) throw ErrorResponses.NotFound('Maintenance request not found');
    sendSuccess(res, result.rows[0]);
  } catch (err) { next(err); }
});

router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { assetId, description, priority } = req.body;
    const result = await query(
      `INSERT INTO maintenance_requests (asset_id, requested_by, description, priority)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [assetId, req.user?.userId, description, priority || 'Medium']
    );
    const pool = require('@utils/database').getPool();
    await logActivity(pool, 'MaintenanceRequested', 'Maintenance', result.rows[0].id, req.user?.userId || '');
    sendSuccess(res, result.rows[0], 201);
  } catch (err) { next(err); }
});

router.put('/:id', requireRole('Admin', 'AssetManager'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { description, priority } = req.body;
    const result = await query(
      `UPDATE maintenance_requests SET description = COALESCE($1, description), priority = COALESCE($2, priority), updated_at = now() WHERE id = $3 RETURNING *`,
      [description, priority, req.params.id]
    );
    if (result.rows.length === 0) throw ErrorResponses.NotFound('Maintenance request not found');
    const pool = require('@utils/database').getPool();
    await logActivity(pool, 'MaintenanceUpdated', 'Maintenance', req.params.id, req.user?.userId || '');
    sendSuccess(res, result.rows[0]);
  } catch (err) { next(err); }
});

router.post('/:id/approve', requireRole('Admin', 'AssetManager'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await transaction(async (client) => {
      const maint = await client.query(`UPDATE maintenance_requests SET status = 'Approved', approved_by = $1, updated_at = now() WHERE id = $2 AND status = 'Pending' RETURNING *`, [req.user?.userId, req.params.id]);
      if (maint.rows.length === 0) throw ErrorResponses.NotFound('Request not found or not Pending');
      
      const m = maint.rows[0];
      await client.query(`UPDATE assets SET status = 'Under Maintenance', updated_at = now() WHERE id = $1`, [m.asset_id]);
      
      // Pause allocation if exists
      await client.query(`UPDATE allocations SET is_paused_for_maintenance = TRUE, updated_at = now() WHERE asset_id = $1 AND returned_at IS NULL`, [m.asset_id]);

      return m;
    });

    const pool = require('@utils/database').getPool();
    await logActivity(pool, 'MaintenanceApproved', 'Maintenance', req.params.id, req.user?.userId || '');
    sendSuccess(res, result);
  } catch (err) { next(err); }
});

router.post('/:id/reject', requireRole('Admin', 'AssetManager'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await query(`UPDATE maintenance_requests SET status = 'Rejected', approved_by = $1, updated_at = now() WHERE id = $2 RETURNING *`, [req.user?.userId, req.params.id]);
    if (result.rows.length === 0) throw ErrorResponses.NotFound('Request not found');
    const pool = require('@utils/database').getPool();
    await logActivity(pool, 'MaintenanceRejected', 'Maintenance', req.params.id, req.user?.userId || '');
    sendSuccess(res, result.rows[0]);
  } catch (err) { next(err); }
});

router.post('/:id/assign', requireRole('Admin', 'AssetManager'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { technicianName } = req.body;
    const result = await query(`UPDATE maintenance_requests SET status = 'TechnicianAssigned', technician_name = $1, updated_at = now() WHERE id = $2 RETURNING *`, [technicianName, req.params.id]);
    if (result.rows.length === 0) throw ErrorResponses.NotFound('Request not found');
    const pool = require('@utils/database').getPool();
    await logActivity(pool, 'MaintenanceAssigned', 'Maintenance', req.params.id, req.user?.userId || '');
    sendSuccess(res, result.rows[0]);
  } catch (err) { next(err); }
});

router.post('/:id/resolve', requireRole('Admin', 'AssetManager'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { resolutionNotes } = req.body;
    const result = await transaction(async (client) => {
      const maint = await client.query(`UPDATE maintenance_requests SET status = 'Resolved', resolution_notes = $1, resolved_at = now(), updated_at = now() WHERE id = $2 RETURNING *`, [resolutionNotes, req.params.id]);
      if (maint.rows.length === 0) throw ErrorResponses.NotFound('Request not found');
      
      const m = maint.rows[0];

      // Unpause allocation if exists, otherwise set asset status to Available/Allocated
      const alloc = await client.query(`UPDATE allocations SET is_paused_for_maintenance = FALSE, updated_at = now() WHERE asset_id = $1 AND returned_at IS NULL RETURNING *`, [m.asset_id]);
      
      if (alloc.rows.length > 0) {
        await client.query(`UPDATE assets SET status = 'Allocated', updated_at = now() WHERE id = $1`, [m.asset_id]);
      } else {
        await client.query(`UPDATE assets SET status = 'Available', updated_at = now() WHERE id = $1`, [m.asset_id]);
      }

      return m;
    });

    const pool = require('@utils/database').getPool();
    await logActivity(pool, 'MaintenanceResolved', 'Maintenance', req.params.id, req.user?.userId || '');
    sendSuccess(res, result);
  } catch (err) { next(err); }
});

export default router;
