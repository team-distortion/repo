import { Router, Request, Response, NextFunction } from 'express';
import { query, transaction } from '@utils/database';
import { sendSuccess, AppError, ErrorResponses } from '@utils/errors';
import { requireRole, buildPaginationMeta, buildLimitOffset, logActivity } from '@middleware';

const router = Router();

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page = 1, pageSize = 10 } = req.query;
    const { limit, offset } = buildLimitOffset(Number(page), Number(pageSize));
    const countRes = await query('SELECT COUNT(*) FROM transfers');
    const result = await query('SELECT * FROM transfers ORDER BY created_at DESC LIMIT $1 OFFSET $2', [limit, offset]);
    sendSuccess(res, result.rows, 200, buildPaginationMeta(parseInt(countRes.rows[0].count), Number(page), Number(pageSize)));
  } catch (err) { next(err); }
});

router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await query('SELECT * FROM transfers WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) throw ErrorResponses.notFound('Transfer not found');
    sendSuccess(res, result.rows[0]);
  } catch (err) { next(err); }
});

router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { assetId, allocationId, requestedToType, requestedToId, reason } = req.body;
    const result = await query(
      `INSERT INTO transfers (asset_id, allocation_id, requested_by, requested_to_type, requested_to_id, reason)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [assetId, allocationId, req.user?.userId, requestedToType, requestedToId, reason]
    );
    await logActivity(req, 'TransferRequested', 'Transfer', result.rows[0].id);
    sendSuccess(res, result.rows[0], 201);
  } catch (err) { next(err); }
});

router.post('/:id/approve', requireRole('Admin', 'AssetManager'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await transaction(async (client) => {
      const transfer = await client.query('SELECT * FROM transfers WHERE id = $1 AND status = $2', [req.params.id, 'Requested']);
      if (transfer.rows.length === 0) throw ErrorResponses.notFound('Transfer request not found or not in Requested state');
      
      const tr = transfer.rows[0];

      // End old allocation
      await client.query(
        `UPDATE allocations SET returned_at = now(), updated_at = now(), return_status = 'Approved' WHERE id = $1`,
        [tr.allocation_id]
      );

      // Create new allocation
      await client.query(
        `INSERT INTO allocations (asset_id, assigned_user_id, assigned_dept_id, allocated_by)
         VALUES ($1, $2, $3, $4)`,
        [tr.asset_id, tr.requested_to_type === 'Employee' ? tr.requested_to_id : null, tr.requested_to_type === 'Department' ? tr.requested_to_id : null, req.user?.userId]
      );

      // Update transfer status
      const updatedTr = await client.query(
        `UPDATE transfers SET status = 'Approved', approved_by = $1, updated_at = now() WHERE id = $2 RETURNING *`,
        [req.user?.userId, req.params.id]
      );
      
      return updatedTr.rows[0];
    });

    await logActivity(req, 'TransferApproved', 'Transfer', req.params.id);
    sendSuccess(res, result);
  } catch (err) { next(err); }
});

router.post('/:id/reject', requireRole('Admin', 'AssetManager'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await query(`UPDATE transfers SET status = 'Rejected', approved_by = $1, updated_at = now() WHERE id = $2 RETURNING *`, [req.user?.userId, req.params.id]);
    if (result.rows.length === 0) throw ErrorResponses.notFound('Transfer not found');
    await logActivity(req, 'TransferRejected', 'Transfer', req.params.id);
    sendSuccess(res, result.rows[0]);
  } catch (err) { next(err); }
});

router.post('/:id/cancel', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await query(`UPDATE transfers SET status = 'Requested' /* wait, cancel? no status in schema for Cancelled? 'Rejected' or delete it */
       WHERE id = $1 AND status = 'Requested' RETURNING *`, [req.params.id]); // Actually schema has Requested, Approved, Rejected, Re-allocated. We will just delete it.
    await query('DELETE FROM transfers WHERE id = $1 AND status = $2', [req.params.id, 'Requested']);
    await logActivity(req, 'TransferCancelled', 'Transfer', req.params.id);
    sendSuccess(res, { message: 'Transfer cancelled' });
  } catch (err) { next(err); }
});

export default router;
