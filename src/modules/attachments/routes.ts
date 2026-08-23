import { Router, Request, Response, NextFunction } from 'express';
import { query } from '@utils/database';
import { sendSuccess, ErrorResponses } from '@utils/errors';
import { upload } from '@middleware';
import fs from 'fs';
import path from 'path';

const router = Router();

router.post('/', upload.single('file'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { entity_type, entity_id } = req.body;
    
    if (!req.file) {
      throw ErrorResponses.ValidationError('No file provided');
    }
    if (!entity_type || !['Asset', 'MaintenanceRequest'].includes(entity_type)) {
      throw ErrorResponses.ValidationError('Invalid or missing entity_type');
    }
    if (!entity_id) {
      throw ErrorResponses.ValidationError('Missing entity_id');
    }

    // The file URL would be /uploads/filename
    const file_url = `/uploads/${req.file.filename}`;

    const result = await query(
      `INSERT INTO attachments (entity_type, entity_id, file_url, mime_type, size_bytes, uploaded_by) 
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [entity_type, entity_id, file_url, req.file.mimetype, req.file.size, req.user?.userId]
    );

    sendSuccess(res, result.rows[0], 201);
  } catch (err) {
    // Clean up uploaded file on error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    next(err);
  }
});

router.get('/:entity_type/:entity_id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { entity_type, entity_id } = req.params;
    const result = await query(
      'SELECT * FROM attachments WHERE entity_type = $1 AND entity_id = $2 ORDER BY created_at DESC',
      [entity_type, entity_id]
    );
    sendSuccess(res, result.rows);
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await query('SELECT * FROM attachments WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) {
      throw ErrorResponses.NotFound('Attachment not found');
    }

    const attachment = result.rows[0];
    
    // Only original uploader, Asset Manager, or Admin can delete
    if (attachment.uploaded_by !== req.user?.userId && !['Admin', 'AssetManager'].includes(req.user?.role || '')) {
       throw ErrorResponses.InsufficientPermissions();
    }

    await query('DELETE FROM attachments WHERE id = $1', [req.params.id]);

    // Remove file from disk
    if (attachment.file_url) {
      const filePath = path.join(process.cwd(), attachment.file_url);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    sendSuccess(res, { message: 'Attachment deleted successfully' });
  } catch (err) {
    next(err);
  }
});

export default router;
