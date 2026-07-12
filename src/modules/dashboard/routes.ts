import { Router, Request, Response, NextFunction } from 'express';
import { query } from '../../utils/database';
import { sendSuccess } from '../../utils/errors';
import { requireRole } from '../../middleware/auth';

const router = Router();

router.get('/', requireRole('Admin', 'AssetManager', 'DepartmentHead'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const totalAssetsRes = await query(`SELECT COUNT(*) FROM assets`);
    const activeAllocationsRes = await query(`SELECT COUNT(*) FROM allocations WHERE returned_at IS NULL`);
    const openMaintenanceRes = await query(`SELECT COUNT(*) FROM maintenance_requests WHERE status IN ('Pending', 'Approved', 'TechnicianAssigned', 'InProgress')`);
    
    // Status breakdown
    const statusRes = await query(`SELECT status, COUNT(*) as count FROM assets GROUP BY status`);
    const statusBreakdown = statusRes.rows.reduce((acc, row) => {
      acc[row.status] = parseInt(row.count, 10);
      return acc;
    }, {});
    
    // Value by category
    const valueRes = await query(`
      SELECT c.name as category, SUM(a.acquisition_cost) as total_value
      FROM assets a
      JOIN categories c ON a.category_id = c.id
      GROUP BY c.id
    `);
    
    const valueByCategory = valueRes.rows.map(r => ({
      category: r.category,
      totalValue: parseFloat(r.total_value || '0')
    }));

    sendSuccess(res, {
      totalAssets: parseInt(totalAssetsRes.rows[0].count, 10),
      activeAllocations: parseInt(activeAllocationsRes.rows[0].count, 10),
      openMaintenanceRequests: parseInt(openMaintenanceRes.rows[0].count, 10),
      statusBreakdown,
      valueByCategory
    }, 200);
  } catch (err) {
    next(err);
  }
});

export default router;
