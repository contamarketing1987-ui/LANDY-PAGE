/**
 * @file server.js
 * @description CupomZap API server entry point.
 * Configures Express with security middleware, routes, and error handling.
 */

require('dotenv').config();

const express   = require('express');
const helmet    = require('helmet');
const cors      = require('cors');
const morgan    = require('morgan');
const compress  = require('compression');
const rateLimit = require('express-rate-limit');

const routes       = require('./routes/index');
const errorHandler = require('./middleware/errorHandler');
const logger       = require('./utils/logger');
const { pool }     = require('./config/database');
const { initScheduler } = require('./services/scheduler');

const app = express();

// ── Security middleware ───────────────────────────────────────────────────────

app.set('trust proxy', 1);

app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

app.use(cors({
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:3000',
    process.env.ADMIN_URL    || 'http://localhost:3002',
  ],
  credentials: true,
  methods: ['GET','POST','PATCH','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization'],
}));

// ── General rate limit ────────────────────────────────────────────────────────

app.use(rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX) || 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, code: 'RATE_LIMITED', message: 'Too many requests' },
}));

// ── Body parsing & compression ────────────────────────────────────────────────

app.use(compress());
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

// ── HTTP logging ──────────────────────────────────────────────────────────────

app.use(morgan(
  process.env.NODE_ENV === 'production' ? 'combined' : 'dev',
  { stream: { write: (msg) => logger.http(msg.trim()) } }
));

// ── Health check ──────────────────────────────────────────────────────────────

app.get('/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({
      status: 'healthy',
      service: 'cupomzap-api',
      version: process.env.npm_package_version || '1.0.0',
      uptime: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
    });
  } catch {
    res.status(503).json({ status: 'unhealthy', timestamp: new Date().toISOString() });
  }
});

// ── API routes ────────────────────────────────────────────────────────────────

const API_PREFIX = `/api/${process.env.API_VERSION || 'v1'}`;
app.use(API_PREFIX, routes);

// ── 404 handler ───────────────────────────────────────────────────────────────

app.use((req, res) => {
  res.status(404).json({
    success: false,
    code: 'NOT_FOUND',
    message: `Route ${req.method} ${req.originalUrl} not found`,
  });
});

// ── Global error handler ──────────────────────────────────────────────────────

app.use(errorHandler);

// ── Start server ──────────────────────────────────────────────────────────────

const PORT = parseInt(process.env.PORT) || 3001;

const server = app.listen(PORT, () => {
  logger.info(`🚀 CupomZap API running`, {
    port: PORT,
    env: process.env.NODE_ENV || 'development',
    prefix: API_PREFIX,
  });

  if (process.env.NODE_ENV !== 'test') {
    initScheduler();
  }
});

// ── Graceful shutdown ─────────────────────────────────────────────────────────

const shutdown = async (signal) => {
  logger.info(`${signal} received — shutting down gracefully`);
  server.close(async () => {
    await pool.end();
    logger.info('PostgreSQL pool closed');
    process.exit(0);
  });
  // Force exit after 10s
  setTimeout(() => process.exit(1), 10_000);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT',  () => shutdown('SIGINT'));
process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled rejection', { reason: String(reason) });
});

module.exports = app; // for tests
