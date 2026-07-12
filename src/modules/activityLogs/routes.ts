import { Router, Request, Response, NextFunction } from 'express';
import { query } from '../../utils/database';
import { sendSuccess } from '../../utils/errors';
import { requireRole } from '../../middleware/auth';
import { buildLimitOffset, buildPaginationMeta } from '../../middleware/pagination';

const router = Router();

// Get activity logs (Admin / AssetManager)
router.get('/', requireRole('Admin', 'AssetManager'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { limit, offset, page } = buildLimitOffset(req);
    
    // Optional filters
    const targetEntity = req.query.targetEntity as string;
    const targetId = req.query.targetId as string;
    
    let whereClauses = [];
    let params: any[] = [];
    let paramIdx = 1;
    
    if (targetEntity) {
      whereClauses.push(`target_entity = $${paramIdx++}`);
      params.push(targetEntity);
    }
    if (targetId) {
      whereClauses.push(`target_id = $${paramIdx++}`);
      params.push(targetId);
    }
    
    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';
    
    const countResult = await query(`SELECT COUNT(*) FROM activity_logs ${whereSql}`, params);
    const total = parseInt(countResult.rows[0].count, 10);
    const pagination = buildPaginationMeta(total, limit, page);
    
    const result = await query(`
      SELECT al.*, u.name as user_name 
      FROM activity_logs al
      LEFT JOIN users u ON al.user_id = u.id
      ${whereSql}
      ORDER BY al.created_at DESC
      LIMIT $${paramIdx++} OFFSET $${paramIdx}
    `, [...params, limit, offset]);
    
    sendSuccess(res, result.rows.map(r => ({
      id: r.id,
      userId: r.user_id,
      userName: r.user_name,
      action: r.action,
      targetEntity: r.target_entity,
      targetId: r.target_id,
      metadata: r.metadata,
      createdAt: r.created_at
    })), 200, pagination);
  } catch (err) {
    next(err);
  }
});

export default router;
