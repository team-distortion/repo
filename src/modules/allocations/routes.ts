import { Router, Request, Response, NextFunction } from 'express';
import { query, transaction } from '@utils/database';
import { sendSuccess, AppError, ErrorResponses } from '@utils/errors';
import { requireRole, buildPaginationMeta, buildLimitOffset, buildOrderByClause, logActivity } from '@middleware';

const router = Router();

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page = 1, pageSize = 10 } = req.query;
    const limit = Number(pageSize) || 10;
    const offset = (Number(page) - 1) * limit;
    const countRes = await query('SELECT COUNT(*) FROM allocations');
    const result = await query('SELECT * FROM allocations ORDER BY created_at DESC LIMIT $1 OFFSET $2', [limit, offset]);
    sendSuccess(res, result.rows, 200, buildPaginationMeta(Number(page), limit, parseInt(countRes.rows[0].count)));
  } catch (err) { next(err); }
});

router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await query('SELECT * FROM allocations WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) throw ErrorResponses.NotFound('Allocation not found');
    sendSuccess(res, result.rows[0]);
  } catch (err) { next(err); }
});

router.post('/', requireRole('Admin', 'AssetManager', 'DepartmentHead'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { assetId, assignedUserId, assignedDeptId, expectedReturnDate } = req.body;
    
    const result = await transaction(async (client) => {
      // Check asset is available
      const assetCheck = await client.query('SELECT status FROM assets WHERE id = $1', [assetId]);
      if (assetCheck.rows.length === 0) throw ErrorResponses.NotFound('Asset not found');
      if (assetCheck.rows[0].status !== 'Available') throw ErrorResponses.ValidationError('Asset is not available for allocation');

      // Attempt to insert allocation (DB unique constraint on asset_id where returned_at IS NULL will prevent double allocation)
      const allocRes = await client.query(
        `INSERT INTO allocations (asset_id, assigned_user_id, assigned_dept_id, allocated_by, expected_return_date)
         VALUES ($1, $2, $3, $4, $5) RETURNING *`,
        [assetId, assignedUserId, assignedDeptId, req.user?.userId, expectedReturnDate]
      );
      
      await client.query('UPDATE assets SET status = $1, updated_at = now() WHERE id = $2', ['Allocated', assetId]);
      return allocRes.rows[0];
    });

    await logActivity(require('@utils/database').getPool(), 'AllocationCreated', 'Allocation', result.id, req.user?.userId || '');
    sendSuccess(res, result, 201);
  } catch (err) { next(err); }
});

router.post('/:id/return', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await query(
      `UPDATE allocations SET return_status = 'PendingApproval', return_requested_at = now(), updated_at = now() 
       WHERE id = $1 AND returned_at IS NULL RETURNING *`,
      [req.params.id]
    );
    if (result.rows.length === 0) throw ErrorResponses.NotFound('Active allocation not found');
    await logActivity(require('@utils/database').getPool(), 'AllocationReturnRequested', 'Allocation', req.params.id, req.user?.userId || '');
    sendSuccess(res, result.rows[0]);
  } catch (err) { next(err); }
});

router.post('/:id/approve-return', requireRole('Admin', 'AssetManager'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { conditionCheckInNotes } = req.body;
    const result = await transaction(async (client) => {
      const alloc = await client.query('SELECT * FROM allocations WHERE id = $1', [req.params.id]);
      if (alloc.rows.length === 0) throw ErrorResponses.NotFound('Allocation not found');
      if (alloc.rows[0].return_status !== 'PendingApproval') throw ErrorResponses.ValidationError('Return not requested');

      const allocRes = await client.query(
        `UPDATE allocations SET return_status = 'Approved', approved_return_by = $1, returned_at = now(), 
         condition_check_in_notes = $2, updated_at = now() WHERE id = $3 RETURNING *`,
        [req.user?.userId, conditionCheckInNotes, req.params.id]
      );

      await client.query('UPDATE assets SET status = $1, updated_at = now() WHERE id = $2', ['Available', alloc.rows[0].asset_id]);
      return allocRes.rows[0];
    });

    await logActivity(require('@utils/database').getPool(), 'AllocationReturnApproved', 'Allocation', req.params.id, req.user?.userId || '');
    sendSuccess(res, result);
  } catch (err) { next(err); }
});

export default router;
