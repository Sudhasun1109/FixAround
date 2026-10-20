const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const config = require('./config/env');
const { apiLimiter } = require('./middleware/rateLimiter');
const errorHandler = require('./middleware/errorHandler');
const AppError = require('./utils/apiError');
const apiResponse = require('./utils/apiResponse');
const { swaggerUi, swaggerSpec } = require('../swagger');

// Import routes
const authRoutes = require('./routes/auth.routes');
const serviceRoutes = require('./routes/service.routes');
const technicianRoutes = require('./routes/technician.routes');
const bookingRoutes = require('./routes/booking.routes');
const estimateRoutes = require('./routes/estimate.routes');
const paymentRoutes = require('./routes/payment.routes');
const invoiceRoutes = require('./routes/invoice.routes');
const reviewRoutes = require('./routes/review.routes');
const claimRoutes = require('./routes/claim.routes');
const notificationRoutes = require('./routes/notification.routes');
const adminRoutes = require('./routes/admin.routes');
const earningsRoutes = require('./routes/earnings.routes');
const customerRoutes = require('./routes/customer.routes');

const app = express();

// Security and HTTP headers
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", 'https://accounts.google.com'],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        fontSrc: ["'self'", 'https://fonts.gstatic.com'],
        imgSrc: ["'self'", 'data:', 'https:', 'blob:'],
        connectSrc: ["'self'", 'https://accounts.google.com', 'https://oauth2.googleapis.com'],
        frameSrc: ["'self'", 'https://accounts.google.com'],
        objectSrc: ["'none'"],
        upgradeInsecureRequests: config.isProduction ? [] : null
      }
    },
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    hsts: config.isProduction
      ? { maxAge: 31536000, includeSubDomains: true, preload: true }
      : false,
    frameguard: { action: 'deny' },
    noSniff: true,
    xssFilter: true
  })
);

// Cross-origin resource sharing
const allowedOrigins = [
  config.clientUrl,
  'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:3000'
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, curl, supertest)
      if (!origin) return callback(null, true);
      if (!config.isProduction) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error('CORS policy: Not allowed by Access-Control-Allow-Origin'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    maxAge: 86400
  })
);

// Request logger
if (config.env !== 'test') {
  app.use(morgan(config.isProduction ? 'combined' : 'dev'));
}

// Request payload parsing with safe memory limit
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

// Apply rate limiter to general API
app.use('/api/', apiLimiter);

// Health check endpoints
app.get(['/health', '/api/v1/health'], (req, res) => {
  return apiResponse.success(res, {
    status: 'UP',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  }, 'FixAround backend is operational');
});

// Swagger documentation
app.use('/api/v1/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'FixAround API Documentation'
}));

// Mount API v1 route groups
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/services', serviceRoutes);
app.use('/api/v1/technicians/earnings', earningsRoutes);
app.use('/api/v1/technicians', technicianRoutes);
app.use('/api/v1/bookings', bookingRoutes);
app.use('/api/v1/estimates', estimateRoutes);
app.use('/api/v1/bookings', estimateRoutes);
app.use('/api/v1/payments', paymentRoutes);
app.use('/api/v1/invoices', invoiceRoutes);
app.use('/api/v1/reviews', reviewRoutes);
app.use('/api/v1/claims', claimRoutes);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/earnings', earningsRoutes);
app.use('/api/v1/customers', customerRoutes);

// Also mount root payments / reviews / claims / invoices to satisfy endpoints like:
// POST /api/v1/bookings/:id/payments, POST /api/v1/bookings/:id/reviews, GET /api/v1/my-payments, etc.
app.use('/api/v1', paymentRoutes);
app.use('/api/v1', invoiceRoutes);
app.use('/api/v1', reviewRoutes);
app.use('/api/v1', claimRoutes);

// Catch-all 404 handler for unknown routes
app.all('*', (req, res, next) => {
  next(AppError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
});

// Global central error handler
app.use(errorHandler);

module.exports = app;
