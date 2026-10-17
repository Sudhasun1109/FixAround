const http = require('http');
const { Server: SocketIOServer } = require('socket.io');
const app = require('./app');
const config = require('./config/env');
const { testConnection, pool } = require('./config/database');
const { startAssignmentExpiryJob } = require('./jobs/assignmentExpiry.job');

const server = http.createServer(app);

// Initialize Socket.IO
const io = new SocketIOServer(server, {
  cors: {
    origin: config.clientUrl || '*',
    methods: ['GET', 'POST']
  }
});

// Socket.IO event handlers
io.on('connection', (socket) => {
  console.log(`[Socket.IO] Client connected: ${socket.id}`);

  socket.on('join_booking', (bookingId) => {
    socket.join(`booking_${bookingId}`);
    console.log(`[Socket.IO] Client ${socket.id} joined room booking_${bookingId}`);
  });

  socket.on('join_user', (userId) => {
    socket.join(`user_${userId}`);
    console.log(`[Socket.IO] Client ${socket.id} joined room user_${userId}`);
  });

  socket.on('disconnect', () => {
    console.log(`[Socket.IO] Client disconnected: ${socket.id}`);
  });
});

// Make io accessible across app if needed
app.set('io', io);

let cronTask = null;

async function bootstrap() {
  try {
    // 1. Verify database connection
    console.log('[Bootstrap] Testing database connection...');
    await testConnection();

    // 2. Start background cron jobs
    console.log('[Bootstrap] Starting background jobs...');
    cronTask = startAssignmentExpiryJob();

    // 3. Start HTTP server
    server.listen(config.port, () => {
      console.log('====================================================');
      console.log(` FixAround API Server running on port ${config.port}`);
      console.log(` Environment : ${config.env}`);
      console.log(` API Base    : ${config.apiBaseUrl}`);
      console.log(` Swagger Docs: http://localhost:${config.port}/api/v1/docs`);
      console.log('====================================================');
    });
  } catch (error) {
    console.error('[Bootstrap] Fatal startup error:', error.message);
    process.exit(1);
  }
}

// Graceful shutdown
function shutdown(signal) {
  console.log(`\n[Server] Received ${signal}. Shutting down gracefully...`);

  if (cronTask) {
    cronTask.stop();
  }

  server.close(async () => {
    console.log('[Server] HTTP server closed.');
    try {
      await pool.end();
      console.log('[Database] MySQL pool closed.');
      process.exit(0);
    } catch (dbErr) {
      console.error('[Database] Error closing MySQL pool:', dbErr.message);
      process.exit(1);
    }
  });

  // Force close if graceful timeout exceeded
  setTimeout(() => {
    console.error('[Server] Forcefully shutting down after timeout');
    process.exit(1);
  }, 10000);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

if (process.env.NODE_ENV !== 'test') {
  bootstrap();
}

module.exports = { server, io };
