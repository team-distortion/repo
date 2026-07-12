/**
 * Application Configuration
 * Loads environment variables and provides type-safe config access
 */

import dotenv from 'dotenv';

dotenv.config();

export const config = {
  // Application
  app: {
    port: parseInt(process.env.APP_PORT || '3000', 10),
    host: process.env.APP_HOST || 'localhost',
    env: process.env.NODE_ENV || 'development',
    isDev: process.env.NODE_ENV === 'development',
    isProd: process.env.NODE_ENV === 'production',
  },

  // Database
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    name: process.env.DB_NAME || 'assetflow',
    user: process.env.DB_USER || 'assetflow_user',
    password: process.env.DB_PASSWORD || 'assetflow_secure_password_change_this',
    poolMin: parseInt(process.env.DB_POOL_MIN || '2', 10),
    poolMax: parseInt(process.env.DB_POOL_MAX || '10', 10),
    connectionString: process.env.DATABASE_URL,
  },

  // JWT & Authentication
  jwt: {
    secret: process.env.JWT_SECRET || 'your_super_secret_jwt_key_change_this_in_production',
    expiry: process.env.JWT_EXPIRY || '1h',
    refreshExpiry: process.env.JWT_REFRESH_EXPIRY || '7d',
  },

  // Logging
  logging: {
    level: process.env.LOG_LEVEL || 'debug',
    format: process.env.LOG_FORMAT || 'json',
  },

  // Rate Limiting
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 minutes
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '1000', 10),
  },

  // CORS
  cors: {
    origin: (process.env.CORS_ORIGIN || 'http://localhost:3000,http://localhost:3001').split(','),
    credentials: true,
  },

  // File Upload
  upload: {
    maxFileSizeMB: parseInt(process.env.MAX_FILE_SIZE_MB || '5', 10),
    allowedMimeTypes: (process.env.ALLOWED_MIME_TYPES || 'image/jpeg,image/png,application/pdf').split(','),
    uploadDir: process.env.UPLOAD_DIR || './uploads',
  },

  // Email
  email: {
    smtpHost: process.env.SMTP_HOST,
    smtpPort: parseInt(process.env.SMTP_PORT || '587', 10),
    smtpUser: process.env.SMTP_USER,
    smtpPassword: process.env.SMTP_PASSWORD,
    smtpFrom: process.env.SMTP_FROM || 'noreply@assetflow.com',
  },

  // Features
  features: {
    enableActivityLogging: process.env.ENABLE_ACTIVITY_LOGGING === 'true',
    enableSSENotifications: process.env.ENABLE_SSE_NOTIFICATIONS === 'true',
    enableAuditCycles: process.env.ENABLE_AUDIT_CYCLES === 'true',
    sseHeartbeatInterval: parseInt(process.env.SSE_HEARTBEAT_INTERVAL || '30', 10),
  },
};

/**
 * Validate critical configuration
 */
export function validateConfig(): void {
  const errors: string[] = [];

  if (!config.jwt.secret || config.jwt.secret.includes('change_this')) {
    errors.push('JWT_SECRET must be set and changed from default');
  }

  if (!config.database.password || config.database.password.includes('change_this')) {
    if (config.app.isProd) {
      errors.push('DB_PASSWORD must be changed from default in production');
    }
  }

  if (errors.length > 0) {
    console.warn('⚠️  Configuration Warnings:');
    errors.forEach((error) => console.warn(`  - ${error}`));
  }
}
