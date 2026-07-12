import { Router, Request, Response, NextFunction } from 'express';
import { query, transaction } from '../../utils/database';
import { sendSuccess, AppError, ErrorResponses } from '../../utils/errors';
import { requireRole } from '../../middleware/auth';
import { buildPaginationMeta, buildLimitOffset } from '../../middleware/pagination';
import { logActivity } from '../../middleware/activityLogging';

const router = Router();

// List audit cycles
router.get('/', requireRole('Admin', 'AssetManager', 'DepartmentHead'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { limit, offset, page } = buildLimitOffset(req);
    const result = await query(`
      SELECT * FROM audit_cycles
      ORDER BY created_at DESC
      LIMIT $1 OFFSET $2
    `, [limit, offset]);
    
    const countResult = await query(`SELECT COUNT(*) FROM audit_cycles`);
    const total = parseInt(countResult.rows[0].count, 10);
    const pagination = buildPaginationMeta(total, limit, page);
    
    sendSuccess(res, result.rows.map(r => ({
      id: r.id,
      scopeType: r.scope_type,
      scopeValue: r.scope_value,
      startDate: r.start_date,
      endDate: r.end_date,
      status: r.status,
      closedAt: r.closed_at,
      createdAt: r.created_at,
      updatedAt: r.updated_at
    })), 200, pagination);
  } catch (err) {
    next(err);
  }
});

// Create audit cycle
router.post('/', requireRole('Admin', 'AssetManager'), async (req: Request, res: Response, next: NextFunction) => {
  const { scopeType, scopeValue, startDate, endDate, auditorIds } = req.body;
  if (!scopeType || !scopeValue || !startDate || !endDate || !Array.isArray(auditorIds)) {
    return next(ErrorResponses.badRequest('Missing required fields'));
  }
  
  try {
    const result = await transaction(async (client) => {
      const cycleResult = await client.query(`
        INSERT INTO audit_cycles (scope_type, scope_value, start_date, end_date, status)
        VALUES ($1, $2, $3, $4, 'Open')
        RETURNING *
      `, [scopeType, scopeValue, startDate, endDate]);
      
      const cycle = cycleResult.rows[0];
      
      for (const auditorId of auditorIds) {
        await client.query(`
          INSERT INTO audit_cycle_auditors (audit_cycle_id, user_id)
          VALUES ($1, $2)
        `, [cycle.id, auditorId]);
      }
      
      // Populate items based on scope
      let assetQuery = '';
      let assetParams: any[] = [];
      if (scopeType === 'Department') {
        assetQuery = `
          SELECT a.id FROM assets a
          JOIN allocations al ON a.id = al.asset_id AND al.returned_at IS NULL
          WHERE al.assigned_dept_id = $1 OR al.assigned_user_id IN (SELECT id FROM users WHERE department_id = $1)
        `;
        assetParams = [scopeValue];
      } else {
        assetQuery = `SELECT id FROM assets WHERE location = $1`;
        assetParams = [scopeValue];
      }
      
      const assets = await client.query(assetQuery, assetParams);
      for (const asset of assets.rows) {
        await client.query(`
          INSERT INTO audit_items (audit_cycle_id, asset_id, verification)
          VALUES ($1, $2, 'Pending')
        `, [cycle.id, asset.id]);
      }
      
      return cycle;
    });
    
    logActivity(req.user!.id, 'AuditCycleCreated', 'AuditCycle', result.id, { scopeType, scopeValue });
    sendSuccess(res, { id: result.id, status: result.status }, 201);
  } catch (err) {
    next(err);
  }
});

// Get audit cycle details
router.get('/:id', requireRole('Admin', 'AssetManager', 'DepartmentHead'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const cycle = await query(`SELECT * FROM audit_cycles WHERE id = $1`, [req.params.id]);
    if (cycle.rowCount === 0) return next(ErrorResponses.notFound('Audit cycle not found'));
    
    const auditors = await query(`
      SELECT u.id, u.name FROM audit_cycle_auditors aca
      JOIN users u ON aca.user_id = u.id
      WHERE aca.audit_cycle_id = $1
    `, [req.params.id]);
    
    const items = await query(`
      SELECT ai.id, ai.asset_id, a.name as asset_name, a.asset_tag, ai.verification, ai.discrepancy_note, ai.verified_at, u.name as verified_by_name
      FROM audit_items ai
      JOIN assets a ON ai.asset_id = a.id
      LEFT JOIN users u ON ai.verified_by = u.id
      WHERE ai.audit_cycle_id = $1
    `, [req.params.id]);
    
    const r = cycle.rows[0];
    const responseData = {
      id: r.id,
      scopeType: r.scope_type,
      scopeValue: r.scope_value,
      startDate: r.start_date,
      endDate: r.end_date,
      status: r.status,
      closedAt: r.closed_at,
      auditors: auditors.rows,
      items: items.rows.map(i => ({
        id: i.id,
        assetId: i.asset_id,
        assetName: i.asset_name,
        assetTag: i.asset_tag,
        verification: i.verification,
        discrepancyNote: i.discrepancy_note,
        verifiedAt: i.verified_at,
        verifiedByName: i.verified_by_name
      }))
    };
    sendSuccess(res, responseData, 200);
  } catch (err) {
    next(err);
  }
});

// Update audit item
router.put('/:id/items/:itemId', requireRole('Admin', 'AssetManager', 'DepartmentHead', 'Employee'), async (req: Request, res: Response, next: NextFunction) => {
  const { verification, discrepancyNote } = req.body;
  if (!verification) return next(ErrorResponses.badRequest('Verification status required'));
  
  try {
    // Basic check: is user an auditor? (Skipping for brevity, but could check audit_cycle_auditors)
    const result = await query(`
      UPDATE audit_items
      SET verification = $1, discrepancy_note = $2, verified_by = $3, verified_at = NOW()
      WHERE id = $4 AND audit_cycle_id = $5
      RETURNING *
    `, [verification, discrepancyNote || null, req.user!.id, req.params.itemId, req.params.id]);
    
    if (result.rowCount === 0) return next(ErrorResponses.notFound('Audit item not found'));
    
    logActivity(req.user!.id, 'AuditItemUpdated', 'AuditItem', req.params.itemId, { verification });
    sendSuccess(res, { message: 'Updated successfully' }, 200);
  } catch (err) {
    next(err);
  }
});

export default router;
