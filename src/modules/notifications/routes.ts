import { Router, Request, Response, NextFunction } from 'express';
import { query } from '../../utils/database';
import { sendSuccess } from '../../utils/errors';
import { requireRole } from '../../middleware/auth';
import { buildPaginationMeta } from '../../middleware/pagination';
import { NotificationService } from '../../services/notificationService';

const router = Router();

// 1. SSE Stream Connection
router.get('/stream', (req: Request, res: Response) => {
  const userId = req.user?.userId;
  if (!userId) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  // Set SSE Headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  const { addSSEClient, removeSSEClient } = require('../../services/notificationService');
  addSSEClient(userId, res);

  res.write(`event: connected\n`);
  res.write(`data: ${JSON.stringify({ message: 'SSE connection established' })}\n\n`);

  // Heartbeat to keep connection alive
  const heartbeatInterval = setInterval(() => {
    res.write(': ping\n\n');
  }, 30000);

  req.on('close', () => {
    clearInterval(heartbeatInterval);
    removeSSEClient(res);
  });
});

// 2. Manual Trigger for testing locally and external cron scheduling
router.post('/trigger-checks', requireRole('Admin', 'AssetManager'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { runOverdueChecks, runBookingChecks } = require('../../services/scheduler');
    const overdueCreated = await runOverdueChecks();
    const bookingsCreated = await runBookingChecks();
    
    sendSuccess(res, {
      message: 'Background checks completed successfully',
      notificationsCreated: {
        overdueAlerts: overdueCreated,
        bookingReminders: bookingsCreated
      }
    }, 200);
  } catch (err) {
    next(err);
  }
});

// 3. Get current user's notifications (supports ?unreadOnly=true & pagination)
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.pageSize) || 20;
    const offset = (page - 1) * limit;
    const unreadOnly = req.query.unreadOnly === 'true' || req.query.status === 'unread';

    let baseSql = `FROM notifications WHERE user_id = $1`;
    const baseParams: any[] = [req.user!.userId];

    if (unreadOnly) {
      baseSql += ` AND is_read = FALSE`;
    }

    const countResult = await query(`SELECT COUNT(*) ${baseSql}`, baseParams);
    const total = parseInt(countResult.rows[0].count, 10);

    const querySql = `SELECT * ${baseSql} ORDER BY created_at DESC LIMIT $2 OFFSET $3`;
    const result = await query(querySql, [req.user!.userId, limit, offset]);

    const pagination = buildPaginationMeta(page, limit, total);
    const formatted = result.rows.map(r => NotificationService.formatNotification(r));
    sendSuccess(res, formatted, 200, pagination);
  } catch (err) {
    next(err);
  }
});

// 4. Mark single notification as read
router.put('/:id/read', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await query(`
      UPDATE notifications SET is_read = TRUE 
      WHERE id = $1 AND user_id = $2
      RETURNING *
    `, [req.params.id, req.user!.userId]);
    
    if (result.rowCount === 0) {
      sendSuccess(res, { message: 'Not found or already read' }, 404);
      return;
    }
    
    sendSuccess(res, { message: 'Marked as read' }, 200);
  } catch (err) {
    next(err);
  }
});

// 5. Mark all as read
router.put('/read-all', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await query(`
      UPDATE notifications SET is_read = TRUE 
      WHERE user_id = $1 AND is_read = FALSE
    `, [req.user!.userId]);
    
    sendSuccess(res, { message: 'All marked as read' }, 200);
  } catch (err) {
    next(err);
  }
});

// 6. Delete single notification by ID
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await query(`
      DELETE FROM notifications 
      WHERE id = $1 AND user_id = $2
      RETURNING *
    `, [req.params.id, req.user!.userId]);

    if (result.rowCount === 0) {
      sendSuccess(res, { message: 'Notification not found' }, 404);
      return;
    }

    sendSuccess(res, { message: 'Notification deleted' }, 200);
  } catch (err) {
    next(err);
  }
});

// 7. Clear read or all notifications
router.delete('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const clearRead = req.query.clearRead === 'true';
    if (clearRead) {
      await query(`DELETE FROM notifications WHERE user_id = $1 AND is_read = TRUE`, [req.user!.userId]);
    } else {
      await query(`DELETE FROM notifications WHERE user_id = $1`, [req.user!.userId]);
    }
    sendSuccess(res, { message: 'Notifications cleared' }, 200);
  } catch (err) {
    next(err);
  }
});

export default router;
