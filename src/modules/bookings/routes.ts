import { Router, Request, Response, NextFunction } from 'express';
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
