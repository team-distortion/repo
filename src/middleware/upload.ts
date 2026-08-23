import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { config } from '@config';
import { ErrorResponses } from '@utils/errors';

// Ensure upload directory exists
const uploadDir = path.resolve(config.upload.uploadDir);
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (config.upload.allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(ErrorResponses.ValidationError(`Invalid file type. Allowed: ${config.upload.allowedMimeTypes.join(', ')}`) as any);
  }
};

export const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB DB limit
  },
  fileFilter
});
