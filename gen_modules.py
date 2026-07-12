import os

base_dir = r"d:\Web_dev\Oddoo\assetflow-backend\src\modules"

files = {
    "assets/routes.ts": """import { Router, Request, Response, NextFunction } from 'express';
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
""",

    "allocations/routes.ts": """import { Router, Request, Response, NextFunction } from 'express';
import { query, transaction } from '@utils/database';
import { sendSuccess, AppError, ErrorResponses } from '@utils/errors';
import { requireRole, buildPaginationMeta, buildLimitOffset, buildOrderByClause, logActivity } from '@middleware';

const router = Router();

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page = 1, pageSize = 10 } = req.query;
    const { limit, offset } = buildLimitOffset(Number(page), Number(pageSize));
    const countRes = await query('SELECT COUNT(*) FROM allocations');
    const result = await query('SELECT * FROM allocations ORDER BY created_at DESC LIMIT $1 OFFSET $2', [limit, offset]);
    sendSuccess(res, result.rows, 200, buildPaginationMeta(parseInt(countRes.rows[0].count), Number(page), Number(pageSize)));
  } catch (err) { next(err); }
});

router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await query('SELECT * FROM allocations WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) throw ErrorResponses.notFound('Allocation not found');
    sendSuccess(res, result.rows[0]);
  } catch (err) { next(err); }
});

router.post('/', requireRole('Admin', 'AssetManager', 'DepartmentHead'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { assetId, assignedUserId, assignedDeptId, expectedReturnDate } = req.body;
    
    const result = await transaction(async (client) => {
      // Check asset is available
      const assetCheck = await client.query('SELECT status FROM assets WHERE id = $1', [assetId]);
      if (assetCheck.rows.length === 0) throw ErrorResponses.notFound('Asset not found');
      if (assetCheck.rows[0].status !== 'Available') throw ErrorResponses.badRequest('Asset is not available for allocation');

      // Attempt to insert allocation (DB unique constraint on asset_id where returned_at IS NULL will prevent double allocation)
      const allocRes = await client.query(
        `INSERT INTO allocations (asset_id, assigned_user_id, assigned_dept_id, allocated_by, expected_return_date)
         VALUES ($1, $2, $3, $4, $5) RETURNING *`,
        [assetId, assignedUserId, assignedDeptId, req.user?.userId, expectedReturnDate]
      );
      
      await client.query('UPDATE assets SET status = $1, updated_at = now() WHERE id = $2', ['Allocated', assetId]);
      return allocRes.rows[0];
    });

    await logActivity(req, 'AllocationCreated', 'Allocation', result.id);
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
    if (result.rows.length === 0) throw ErrorResponses.notFound('Active allocation not found');
    await logActivity(req, 'AllocationReturnRequested', 'Allocation', req.params.id);
    sendSuccess(res, result.rows[0]);
  } catch (err) { next(err); }
});

router.post('/:id/approve-return', requireRole('Admin', 'AssetManager'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { conditionCheckInNotes } = req.body;
    const result = await transaction(async (client) => {
      const alloc = await client.query('SELECT * FROM allocations WHERE id = $1', [req.params.id]);
      if (alloc.rows.length === 0) throw ErrorResponses.notFound('Allocation not found');
      if (alloc.rows[0].return_status !== 'PendingApproval') throw ErrorResponses.badRequest('Return not requested');

      const allocRes = await client.query(
        `UPDATE allocations SET return_status = 'Approved', approved_return_by = $1, returned_at = now(), 
         condition_check_in_notes = $2, updated_at = now() WHERE id = $3 RETURNING *`,
        [req.user?.userId, conditionCheckInNotes, req.params.id]
      );

      await client.query('UPDATE assets SET status = $1, updated_at = now() WHERE id = $2', ['Available', alloc.rows[0].asset_id]);
      return allocRes.rows[0];
    });

    await logActivity(req, 'AllocationReturnApproved', 'Allocation', req.params.id);
    sendSuccess(res, result);
  } catch (err) { next(err); }
});

export default router;
""",

    "transfers/routes.ts": """import { Router, Request, Response, NextFunction } from 'express';
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
""",

    "bookings/routes.ts": """import { Router, Request, Response, NextFunction } from 'express';
import { query } from '@utils/database';
import { sendSuccess, AppError, ErrorResponses } from '@utils/errors';
import { buildPaginationMeta, buildLimitOffset, logActivity } from '@middleware';

const router = Router();

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page = 1, pageSize = 10 } = req.query;
    const { limit, offset } = buildLimitOffset(Number(page), Number(pageSize));
    const countRes = await query('SELECT COUNT(*) FROM resource_bookings');
    const result = await query('SELECT * FROM resource_bookings ORDER BY created_at DESC LIMIT $1 OFFSET $2', [limit, offset]);
    sendSuccess(res, result.rows, 200, buildPaginationMeta(parseInt(countRes.rows[0].count), Number(page), Number(pageSize)));
  } catch (err) { next(err); }
});

router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await query('SELECT * FROM resource_bookings WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) throw ErrorResponses.notFound('Booking not found');
    sendSuccess(res, result.rows[0]);
  } catch (err) { next(err); }
});

router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { assetId, bookedForType, bookedForDeptId, startTime, endTime } = req.body;
    // startTime and endTime into TSTZRANGE
    const bookingRange = `[${startTime}, ${endTime})`;

    const result = await query(
      `INSERT INTO resource_bookings (asset_id, booked_by_id, booked_for_type, booked_for_dept_id, booking_range)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [assetId, req.user?.userId, bookedForType || 'Self', bookedForDeptId, bookingRange]
    );

    await logActivity(req, 'BookingCreated', 'Booking', result.rows[0].id);
    sendSuccess(res, result.rows[0], 201);
  } catch (err: any) {
    if (err.code === '23P01') {
      next(ErrorResponses.badRequest('Booking time conflicts with an existing booking.'));
    } else {
      next(err);
    }
  }
});

router.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { startTime, endTime } = req.body;
    const bookingRange = `[${startTime}, ${endTime})`;
    const result = await query(
      `UPDATE resource_bookings SET booking_range = $1, updated_at = now() WHERE id = $2 RETURNING *`,
      [bookingRange, req.params.id]
    );
    if (result.rows.length === 0) throw ErrorResponses.notFound('Booking not found');
    
    await logActivity(req, 'BookingUpdated', 'Booking', req.params.id);
    sendSuccess(res, result.rows[0]);
  } catch (err: any) {
    if (err.code === '23P01') {
      next(ErrorResponses.badRequest('Booking time conflicts with an existing booking.'));
    } else {
      next(err);
    }
  }
});

router.post('/:id/cancel', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { cancellationReason } = req.body;
    const result = await query(
      `UPDATE resource_bookings SET status = 'Cancelled', cancellation_reason = $1, updated_at = now() WHERE id = $2 RETURNING *`,
      [cancellationReason, req.params.id]
    );
    if (result.rows.length === 0) throw ErrorResponses.notFound('Booking not found');
    await logActivity(req, 'BookingCancelled', 'Booking', req.params.id);
    sendSuccess(res, result.rows[0]);
  } catch (err) { next(err); }
});

export default router;
""",

    "maintenance/routes.ts": """import { Router, Request, Response, NextFunction } from 'express';
import { query, transaction } from '@utils/database';
import { sendSuccess, AppError, ErrorResponses } from '@utils/errors';
import { requireRole, buildPaginationMeta, buildLimitOffset, logActivity } from '@middleware';

const router = Router();

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page = 1, pageSize = 10 } = req.query;
    const { limit, offset } = buildLimitOffset(Number(page), Number(pageSize));
    const countRes = await query('SELECT COUNT(*) FROM maintenance_requests');
    const result = await query('SELECT * FROM maintenance_requests ORDER BY created_at DESC LIMIT $1 OFFSET $2', [limit, offset]);
    sendSuccess(res, result.rows, 200, buildPaginationMeta(parseInt(countRes.rows[0].count), Number(page), Number(pageSize)));
  } catch (err) { next(err); }
});

router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await query('SELECT * FROM maintenance_requests WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) throw ErrorResponses.notFound('Maintenance request not found');
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
    await logActivity(req, 'MaintenanceRequested', 'Maintenance', result.rows[0].id);
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
    if (result.rows.length === 0) throw ErrorResponses.notFound('Maintenance request not found');
    await logActivity(req, 'MaintenanceUpdated', 'Maintenance', req.params.id);
    sendSuccess(res, result.rows[0]);
  } catch (err) { next(err); }
});

router.post('/:id/approve', requireRole('Admin', 'AssetManager'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await transaction(async (client) => {
      const maint = await client.query(`UPDATE maintenance_requests SET status = 'Approved', approved_by = $1, updated_at = now() WHERE id = $2 AND status = 'Pending' RETURNING *`, [req.user?.userId, req.params.id]);
      if (maint.rows.length === 0) throw ErrorResponses.notFound('Request not found or not Pending');
      
      const m = maint.rows[0];
      await client.query(`UPDATE assets SET status = 'Under Maintenance', updated_at = now() WHERE id = $1`, [m.asset_id]);
      
      // Pause allocation if exists
      await client.query(`UPDATE allocations SET is_paused_for_maintenance = TRUE, updated_at = now() WHERE asset_id = $1 AND returned_at IS NULL`, [m.asset_id]);

      return m;
    });

    await logActivity(req, 'MaintenanceApproved', 'Maintenance', req.params.id);
    sendSuccess(res, result);
  } catch (err) { next(err); }
});

router.post('/:id/reject', requireRole('Admin', 'AssetManager'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await query(`UPDATE maintenance_requests SET status = 'Rejected', approved_by = $1, updated_at = now() WHERE id = $2 RETURNING *`, [req.user?.userId, req.params.id]);
    if (result.rows.length === 0) throw ErrorResponses.notFound('Request not found');
    await logActivity(req, 'MaintenanceRejected', 'Maintenance', req.params.id);
    sendSuccess(res, result.rows[0]);
  } catch (err) { next(err); }
});

router.post('/:id/assign', requireRole('Admin', 'AssetManager'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { technicianName } = req.body;
    const result = await query(`UPDATE maintenance_requests SET status = 'TechnicianAssigned', technician_name = $1, updated_at = now() WHERE id = $2 RETURNING *`, [technicianName, req.params.id]);
    if (result.rows.length === 0) throw ErrorResponses.notFound('Request not found');
    await logActivity(req, 'MaintenanceAssigned', 'Maintenance', req.params.id);
    sendSuccess(res, result.rows[0]);
  } catch (err) { next(err); }
});

router.post('/:id/resolve', requireRole('Admin', 'AssetManager'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { resolutionNotes } = req.body;
    const result = await transaction(async (client) => {
      const maint = await client.query(`UPDATE maintenance_requests SET status = 'Resolved', resolution_notes = $1, resolved_at = now(), updated_at = now() WHERE id = $2 RETURNING *`, [resolutionNotes, req.params.id]);
      if (maint.rows.length === 0) throw ErrorResponses.notFound('Request not found');
      
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

    await logActivity(req, 'MaintenanceResolved', 'Maintenance', req.params.id);
    sendSuccess(res, result);
  } catch (err) { next(err); }
});

export default router;
"""
}

for filepath, content in files.items():
    full_path = os.path.join(base_dir, filepath)
    os.makedirs(os.path.dirname(full_path), exist_ok=True)
    with open(full_path, 'w', encoding='utf-8') as f:
        f.write(content)

print("Modules generated.")
