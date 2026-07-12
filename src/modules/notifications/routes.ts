import { Router, Request, Response, NextFunction } from 'express';
import { query } from '../../utils/database';
import { sendSuccess } from '../../utils/errors';
import { requireRole } from '../../middleware/auth';
import { buildLimitOffset, buildPaginationMeta } from '../../middleware/pagination';

const router = Router();

// Get current user's notifications
router.get('/', requireRole('Admin', 'AssetManager', 'DepartmentHead', 'Employee'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { limit, offset, page } = buildLimitOffset(req);
    const result = await query(`
      SELECT * FROM notifications 
      WHERE user_id = $1 
      ORDER BY created_at DESC
      LIMIT $2 OFFSET $3
    `, [req.user!.id, limit, offset]);
    
    const countResult = await query(`SELECT COUNT(*) FROM notifications WHERE user_id = $1`, [req.user!.id]);
    const total = parseInt(countResult.rows[0].count, 10);
    const pagination = buildPaginationMeta(total, limit, page);
    
    sendSuccess(res, result.rows.map(r => ({
      id: r.id,
      userId: r.user_id,
      type: r.type,
      message: r.message,
      isRead: r.is_read,
      relatedEntity: r.related_entity,
      relatedId: r.related_id,
      createdAt: r.created_at
    })), 200, pagination);
  } catch (err) {
    next(err);
  }
});

// Mark as read
router.put('/:id/read', requireRole('Admin', 'AssetManager', 'DepartmentHead', 'Employee'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await query(`
      UPDATE notifications SET is_read = TRUE 
      WHERE id = $1 AND user_id = $2
      RETURNING *
    `, [req.params.id, req.user!.id]);
    
    if (result.rowCount === 0) {
      return sendSuccess(res, { message: 'Not found or already read' }, 404);
    }
    
    sendSuccess(res, { message: 'Marked as read' }, 200);
  } catch (err) {
    next(err);
  }
});

// Mark all as read
router.put('/read-all', requireRole('Admin', 'AssetManager', 'DepartmentHead', 'Employee'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    await query(`
      UPDATE notifications SET is_read = TRUE 
      WHERE user_id = $1 AND is_read = FALSE
    `, [req.user!.id]);
    
    sendSuccess(res, { message: 'All marked as read' }, 200);
  } catch (err) {
    next(err);
  }
});

export default router;
