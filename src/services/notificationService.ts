import { PoolClient } from 'pg';
import { getPool } from '@utils/database';
import logger from '@utils/logger';

export class NotificationService {
  /**
   * Create a notification using an existing transaction client.
   * Useful when creating a notification as part of a larger transaction.
   */
  static async createWithClient(
    client: PoolClient,
    userId: string,
    type: string,
    message: string,
    relatedEntity?: string,
    relatedId?: string,
    details?: Record<string, any>
  ): Promise<void> {
    try {
      const sql = `
        INSERT INTO notifications 
          (user_id, type, message, related_entity, related_id)
        VALUES 
          ($1, $2, $3, $4, $5)
      `;
      const params = [userId, type, message, relatedEntity || null, relatedId || null];
      await client.query(sql, params);
      
      // TODO: Emit SSE event if implemented
    } catch (error) {
      logger.error('Failed to create notification', error, { userId, type, message });
      // We usually don't want a notification failure to roll back the main transaction
    }
  }

  /**
   * Create a standalone notification
   */
  static async create(
    userId: string,
    type: string,
    message: string,
    relatedEntity?: string,
    relatedId?: string,
    details?: Record<string, any>
  ): Promise<void> {
    const pool = getPool();
    try {
      const sql = `
        INSERT INTO notifications 
          (user_id, type, message, related_entity, related_id)
        VALUES 
          ($1, $2, $3, $4, $5)
      `;
      const params = [userId, type, message, relatedEntity || null, relatedId || null];
      await pool.query(sql, params);
      
      // TODO: Emit SSE event if implemented
    } catch (error) {
      logger.error('Failed to create notification', error, { userId, type, message });
    }
  }
}
