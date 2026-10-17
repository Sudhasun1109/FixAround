const path = require('path');
const dotenv = require('dotenv');

// Attempt to load .env from server directory first, fallback to root if not found
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
if (!process.env.DB_HOST) {
  dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
}

const requiredEnvVars = ['DB_HOST', 'DB_USER', 'DB_NAME', 'JWT_SECRET'];

const missingVars = requiredEnvVars.filter((varName) => !process.env[varName]);

if (missingVars.length > 0) {
  console.error('\x1b[31m%s\x1b[0m', `CRITICAL ERROR: Missing required environment variables: ${missingVars.join(', ')}`);
  console.error('Please configure them in your .env file before starting the application.');
  process.exit(1);
}

const config = {
  env: process.env.NODE_ENV || 'development',
  isProduction: process.env.NODE_ENV === 'production',
  port: parseInt(process.env.PORT || '3000', 10),
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  apiBaseUrl: process.env.API_BASE_URL || 'http://localhost:3000/api/v1',

  db: {
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '3306', 10),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME,
    connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT || '10', 10),
    waitForConnections: true,
    queueLimit: 0,
    timezone: 'Z',
    decimalNumbers: true
  },

  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
    refreshSecret: process.env.REFRESH_TOKEN_SECRET || process.env.JWT_SECRET + '_refresh',
    refreshExpiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '7d'
  },

  maps: {
    apiKey: process.env.MAPS_API_KEY || ''
  },

  payment: {
    razorpayKeyId: process.env.RAZORPAY_KEY_ID || '',
    razorpayKeySecret: process.env.RAZORPAY_KEY_SECRET || '',
    stripeSecretKey: process.env.STRIPE_SECRET_KEY || '',
    stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET || ''
  },

  email: {
    host: process.env.SMTP_HOST || '',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    from: process.env.EMAIL_FROM || 'noreply@fixaround.com'
  },

  platform: {
    technicianResponseTimeoutSeconds: parseInt(process.env.TECHNICIAN_RESPONSE_TIMEOUT_SECONDS || '300', 10),
    maxAssignmentAttempts: parseInt(process.env.TECHNICIAN_MAX_ASSIGNMENT_ATTEMPTS || '3', 10),
    commissionPercent: parseFloat(process.env.PLATFORM_COMMISSION_PERCENT || '15.0'),
    defaultSearchRadiusKm: parseFloat(process.env.DEFAULT_SEARCH_RADIUS_KM || '10.0'),
    defaultWarrantyPeriodDays: parseInt(process.env.DEFAULT_WARRANTY_PERIOD_DAYS || '7', 10)
  },

  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
    authMax: parseInt(process.env.AUTH_RATE_LIMIT_MAX || '20', 10)
  },

  upload: {
    dir: process.env.UPLOAD_DIR || path.resolve(__dirname, '../../uploads'),
    maxFileSizeMb: parseInt(process.env.MAX_FILE_SIZE_MB || '5', 10)
  }
};

module.exports = config;
