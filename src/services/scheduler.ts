import { query, transaction } from '@utils/database';
import { NotificationService } from './notificationService';
import logger from '@utils/logger';

// Default interval values (can be overridden in environment variables)
const ENABLE_IN_PROCESS_SCHEDULER = process.env.ENABLE_IN_PROCESS_SCHEDULER !== 'false';
const OVERDUE_CHECK_INTERVAL_MS = parseInt(process.env.OVERDUE_CHECK_INTERVAL_MS || '3600000', 10); // 1 hour
const BOOKING_CHECK_INTERVAL_MS = parseInt(process.env.BOOKING_CHECK_INTERVAL_MS || '300000', 10);  // 5 minutes
const BOOKING_REMINDER_WINDOW_MINS = parseInt(process.env.BOOKING_REMINDER_WINDOW_MINS || '15', 10);

let overdueTimer: NodeJS.Timeout | null = null;
let bookingTimer: NodeJS.Timeout | null = null;

/**
 * Runs overdue return checks.
 * Finds active allocations past their expected return date.
 * Returns the number of notifications generated.
 */
export async function runOverdueChecks(): Promise<number> {
  let notificationsCount = 0;

  await transaction(async (client) => {
    // Acquire PostgreSQL advisory lock (ID 1001) to prevent concurrent executions in a clustered environment
    const lockResult = await client.query('SELECT pg_try_advisory_xact_lock(1001) as locked');
    const isLocked = lockResult.rows[0]?.locked;
    if (!isLocked) {
      logger.debug('Overdue checks skipped: Advisory lock 1001 is held by another instance');
      return;
    }

    logger.debug('Running overdue return checks...');

    // Fetch allocations that are overdue (expected_return_date is in the past, returned_at is null)
    const overdueAllocations = await client.query(`
      SELECT a.id, a.assigned_user_id, a.assigned_dept_id, a.expected_return_date, ast.asset_tag 
      FROM allocations a
      JOIN assets ast ON a.asset_id = ast.id
      WHERE a.expected_return_date < CURRENT_DATE 
        AND a.returned_at IS NULL
    `);

    for (const alloc of overdueAllocations.rows) {
      const { id: allocationId, assigned_user_id, assigned_dept_id, expected_return_date, asset_tag } = alloc;

      // Check if an OverdueReturnAlert was already created for this allocation in the last 24 hours
      const duplicateCheck = await client.query(`
        SELECT id FROM notifications 
        WHERE type = 'OverdueReturnAlert' 
          AND related_entity = 'Allocation' 
          AND related_id = $1 
          AND created_at >= NOW() - INTERVAL '1 day'
      `, [allocationId]);

      if (duplicateCheck.rows.length === 0) {
        const formattedDate = new Date(expected_return_date).toLocaleDateString();
        const message = `Asset ${asset_tag} expected return date (${formattedDate}) is overdue.`;

        // 1. Notify holding employee or department head
        if (assigned_user_id) {
          await NotificationService.createWithClient(
            client,
            assigned_user_id,
            'OverdueReturnAlert',
            message,
            'Allocation',
            allocationId
          );
          notificationsCount++;
        } else if (assigned_dept_id) {
          const dept = await client.query('SELECT head_user_id FROM departments WHERE id = $1', [assigned_dept_id]);
          const headId = dept.rows[0]?.head_user_id;
          if (headId) {
            await NotificationService.createWithClient(
              client,
              headId,
              'OverdueReturnAlert',
              message,
              'Allocation',
              allocationId
            );
            notificationsCount++;
          }
        }

        // 2. Notify all Asset Managers
        const managers = await client.query("SELECT id FROM users WHERE role = 'AssetManager' AND status = 'Active'");
        for (const mgr of managers.rows) {
          if (mgr.id !== assigned_user_id) {
            await NotificationService.createWithClient(
              client,
              mgr.id,
              'OverdueReturnAlert',
              message,
              'Allocation',
              allocationId
            );
            notificationsCount++;
          }
        }
      }
    }
  });

  return notificationsCount;
}

/**
 * Runs booking reminder checks.
 * Finds upcoming bookings starting within the next window (e.g. 15 mins).
 * Returns the number of notifications generated.
 */
export async function runBookingChecks(): Promise<number> {
  let notificationsCount = 0;

  await transaction(async (client) => {
    // Acquire PostgreSQL advisory lock (ID 1002) to prevent concurrent executions in a clustered environment
    const lockResult = await client.query('SELECT pg_try_advisory_xact_lock(1002) as locked');
    const isLocked = lockResult.rows[0]?.locked;
    if (!isLocked) {
      logger.debug('Booking checks skipped: Advisory lock 1002 is held by another instance');
      return;
    }

    logger.debug('Running booking reminder checks...');

    // Fetch upcoming bookings starting in the next BOOKING_REMINDER_WINDOW_MINS minutes
    // lower(booking_range) gets the start timestamp of the tstzrange
    const upcomingBookings = await client.query(`
      SELECT rb.id, rb.booked_by_id, lower(rb.booking_range) as start_time, ast.name as resource_name
      FROM resource_bookings rb
      JOIN assets ast ON rb.asset_id = ast.id
      WHERE rb.status = 'Upcoming'
        AND lower(rb.booking_range) > NOW()
        AND lower(rb.booking_range) <= NOW() + ($1 || ' minutes')::INTERVAL
    `, [BOOKING_REMINDER_WINDOW_MINS]);

    for (const booking of upcomingBookings.rows) {
      const { id: bookingId, booked_by_id, start_time, resource_name } = booking;

      // Check if a BookingReminder has already been created for this booking
      const duplicateCheck = await client.query(`
        SELECT id FROM notifications 
        WHERE type = 'BookingReminder' 
          AND related_entity = 'Booking' 
          AND related_id = $1
      `, [bookingId]);

      if (duplicateCheck.rows.length === 0) {
        const startTimeDate = new Date(start_time);
        const timeDiffMs = startTimeDate.getTime() - Date.now();
        const minsLeft = Math.max(1, Math.round(timeDiffMs / 60000));
        const message = `Reminder: Your booking for ${resource_name} starts in ${minsLeft} min.`;

        await NotificationService.createWithClient(
          client,
          booked_by_id,
          'BookingReminder',
          message,
          'Booking',
          bookingId
        );
        notificationsCount++;
      }
    }
  });

  return notificationsCount;
}

/**
 * Initialize background timers for the scheduler.
 */
export function startScheduler() {
  if (!ENABLE_IN_PROCESS_SCHEDULER) {
    logger.debug('In-process background notification scheduler is disabled by environment configuration');
    return;
  }

  logger.debug(`Starting background notification scheduler: Overdue checks every ${OVERDUE_CHECK_INTERVAL_MS}ms, Booking reminders every ${BOOKING_CHECK_INTERVAL_MS}ms`);

  // Run immediately on startup (wrapped in a delay to avoid blocking server boot)
  setTimeout(() => {
    runOverdueChecks().catch(err => logger.error('Startup overdue check failed', err));
    runBookingChecks().catch(err => logger.error('Startup booking check failed', err));
  }, 5000);

  // Set recurring intervals
  overdueTimer = setInterval(() => {
    runOverdueChecks().catch(err => logger.error('Recurring overdue check failed', err));
  }, OVERDUE_CHECK_INTERVAL_MS);

  bookingTimer = setInterval(() => {
    runBookingChecks().catch(err => logger.error('Recurring booking check failed', err));
  }, BOOKING_CHECK_INTERVAL_MS);
}

/**
 * Stop background timers.
 */
export function stopScheduler() {
  if (overdueTimer) {
    clearInterval(overdueTimer);
    overdueTimer = null;
  }
  if (bookingTimer) {
    clearInterval(bookingTimer);
    bookingTimer = null;
  }
  logger.debug('Background notification scheduler stopped');
}
