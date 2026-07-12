import { Router, Request, Response, NextFunction } from 'express';
import { query } from '../../utils/database';
import { sendSuccess } from '../../utils/errors';
import { requireRole } from '../../middleware/auth';

const router = Router();

// Asset Utilization Report
router.get('/utilization', requireRole('Admin', 'AssetManager', 'DepartmentHead'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await query(`
      SELECT 
        a.id, a.name, a.asset_tag, a.category_id,
        COUNT(al.id) as total_allocations,
        SUM(EXTRACT(EPOCH FROM (COALESCE(al.returned_at, NOW()) - al.allocated_at))) / 3600 as total_hours_allocated
      FROM assets a
      LEFT JOIN allocations al ON a.id = al.asset_id
      GROUP BY a.id
      ORDER BY total_hours_allocated DESC
    `);
    
    sendSuccess(res, result.rows.map(r => ({
      id: r.id,
      name: r.name,
      assetTag: r.asset_tag,
      categoryId: r.category_id,
      totalAllocations: parseInt(r.total_allocations, 10),
      totalHoursAllocated: parseFloat(r.total_hours_allocated || '0')
    })), 200);
  } catch (err) {
    next(err);
  }
});

// Maintenance Costs / Frequency Report
router.get('/maintenance', requireRole('Admin', 'AssetManager'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await query(`
      SELECT 
        a.id, a.name, a.asset_tag,
        COUNT(mr.id) as maintenance_count
      FROM assets a
      JOIN maintenance_requests mr ON a.id = mr.asset_id
      GROUP BY a.id
      ORDER BY maintenance_count DESC
    `);
    
    sendSuccess(res, result.rows.map(r => ({
      id: r.id,
      name: r.name,
      assetTag: r.asset_tag,
      maintenanceCount: parseInt(r.maintenance_count, 10)
    })), 200);
  } catch (err) {
    next(err);
  }
});

export default router;
