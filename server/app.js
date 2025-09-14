// --- TEMPORARY DEBUGGING ---
const fs_debug = require('fs');
const path_debug = require('path');
console.log('--- STARTING DEBUG INFO ---');
console.log('Current Working Directory (process.cwd()):', process.cwd());
console.log('Script Directory (__dirname):', __dirname);
try {
    const projectRootContents = fs_debug.readdirSync(process.cwd());
    console.log('Contents of CWD:', projectRootContents);
} catch (e) {
    console.error('Error reading CWD:', e.message);
}
console.log('--- ENDING DEBUG INFO ---');
// --- END TEMPORARY DEBUGGING ---

// Declare server variable in module scope for graceful shutdown and export
console.log('--- Express is running! ---');

let server;

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const slowDown = require('express-slow-down');
const compression = require('compression');
const path = require('path');
const fs = require('fs').promises;
const winston = require('winston');
const { body, validationResult } = require('express-validator');
const Joi = require('joi');
const mongoose = require('mongoose'); // Added for graceful shutdown

require('dotenv').config();

const connectDB = require('./db');
const Guest = require('./models/Guest');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Logger configuration
const logger = winston.createLogger({
  level: NODE_ENV === 'production' ? 'info' : 'debug',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'procheck-ocr', version: '1.0.0' },
  transports: [
    new winston.transports.File({ filename: path.join(process.cwd(), 'logs/error.log'), level: 'error' }),
    new winston.transports.File({ filename: path.join(process.cwd(), 'logs/combined.log') }),
    new winston.transports.Console({
      format: winston.format.combine(winston.format.colorize(), winston.format.simple())
    })
  ]
});

// Ensure required directories exist
const ensureDirectories = async () => {
  const dirs = ['logs', 'data', 'uploads'];
  for (const dir of dirs) {
    try {
      await fs.mkdir(path.join(process.cwd(), dir), { recursive: true });
    } catch (error) {
      logger.error(`Failed to create directory ${dir}:`, error);
    }
  }
};


// Security & middleware setup
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: [
        "'self'",
        "'unsafe-eval'",   // allow WASM instantiation
        "https://unpkg.com",
        "https://tessdata.projectnaptha.com"
      ],
      connectSrc: [
        "'self'",
        "data:",           // allow data: WASM fetch
        "https://unpkg.com",
        "https://tessdata.projectnaptha.com"
      ],
      imgSrc: ["'self'", "data:", "blob:"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      workerSrc: ["'self'", "blob:"]
    }
  },
  crossOriginEmbedderPolicy: false
}));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.',
    retryAfter: 15 * 60
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.path === '/api/health' || req.path.startsWith('/assets')
});

const speedLimiter = slowDown({
  windowMs: 15 * 60 * 1000,
  delayAfter: 100,
  delayMs: () => 200
});

// Apply rate limiting and slowdown to API routes
app.use('/api/', limiter);
app.use('/api/', speedLimiter);

const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:3000,http://127.0.0.1:3000').split(',').map(o => o.trim());
app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true); // Allow non-origin requests like curl
    if (allowedOrigins.indexOf(origin) === -1) {
      return callback(new Error('Not allowed by CORS'), false);
    }
    return callback(null, true);
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true
}));

app.use(compression());
app.use(express.json({
  limit: '10mb',
  verify: (req, res, buf) => { req.rawBody = buf; }
}));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// --- FIX #1: Correctly serve static files from the root 'public' directory ---
app.use(express.static(path.join(process.cwd(), 'public'), {
  maxAge: NODE_ENV === 'production' ? '1y' : '0',
  etag: true,
  lastModified: true,
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.js')) {
      res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
    }
  }
}));


// Request logging middleware
app.use((req, res, next) => {
  const startTime = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    logger.info('HTTP Request', {
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });
  });
  next();
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  const healthData = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
    version: '1.0.0',
    environment: NODE_ENV,
    memory: {
      used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + ' MB',
      total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + ' MB'
    },
    system: {
      platform: process.platform,
      nodeVersion: process.version
    }
  };
  logger.debug('Health check requested', healthData);
  res.json(healthData);
});

// Input validation schema with Joi
const guestSchema = Joi.object({
  fullName: Joi.string().min(2).max(100).pattern(/^[a-zA-Z\s\-\'\u0900-\u097F]+$/).required()
    .messages({
      'string.pattern.base': 'Name can only contain letters, spaces, hyphens, apostrophes, and Hindi characters',
      'string.min': 'Name must be at least 2 characters long',
      'string.max': 'Name cannot exceed 100 characters',
      'any.required': 'Full name is required'
    }),
  dateOfBirth: Joi.date().max('now').min(new Date(1900, 0, 1)).required()
    .messages({
      'date.max': 'Date of birth cannot be in the future',
      'date.min': 'Please enter a valid date of birth',
      'any.required': 'Date of birth is required'
    }),
  idNumber: Joi.string().min(10).max(16).pattern(/^[0-9]+$/).required()
    .messages({
      'string.pattern.base': 'ID number can only contain digits',
      'string.min': 'ID number must be at least 10 digits long',
      'string.max': 'ID number cannot exceed 16 digits',
      'any.required': 'ID number is required'
    }),
  admNo: Joi.string().min(3).max(20).pattern(/^[A-Za-z0-9\-\/]+$/).required()
    .messages({
      'string.pattern.base': 'Admission number can only contain letters, numbers, hyphens, and slashes',
      'string.min': 'Admission number must be at least 3 characters long',
      'string.max': 'Admission number cannot exceed 20 characters',
      'any.required': 'Admission number is required'
    })
});

// POST guest registration route
app.post('/api/guests', [
  body('fullName').trim().escape().notEmpty(),
  body('dateOfBirth').isISO8601().toDate(),
  body('idNumber').trim().escape().isLength({ min: 10, max: 16 }),
  body('admNo').trim().escape().isLength({ min: 3, max: 20 })
], async (req, res) => {
  const startTime = Date.now();
  try {
    logger.info('Guest registration attempt', { ip: req.ip, body: { ...req.body, idNumber: '***' + req.body.idNumber?.slice(-4) } });

    const validatorErrors = validationResult(req);
    if (!validatorErrors.isEmpty()) {
      logger.warn('Express validation failed', { errors: validatorErrors.array() });
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validatorErrors.array().map(err => ({
          field: err.path,
          message: err.msg,
          value: err.value
        }))
      });
    }

    const { error, value } = guestSchema.validate(req.body, { stripUnknown: true, abortEarly: false });
    if (error) {
      logger.warn('Joi validation failed', { errors: error.details });
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message,
          value: detail.context?.value
        }))
      });
    }

    const businessErrors = await performBusinessValidation(value);
    if (businessErrors.length > 0) {
      logger.warn('Business validation failed', { errors: businessErrors });
      return res.status(400).json({ success: false, message: 'Business validation failed', errors: businessErrors });
    }

    const guestId = await registerGuest(value, req.ip);
    const processingTime = Date.now() - startTime;
    logger.info('Guest registered successfully', { guestId, name: value.fullName, processingTime: `${processingTime}ms` });

    res.status(201).json({
      success: true,
      message: 'Guest registered successfully',
      data: { guestId, registeredAt: new Date().toISOString(), processingTime: `${processingTime}ms` }
    });
  } catch (error) {
    const processingTime = Date.now() - startTime;
    logger.error('Guest registration failed', { error: error.message, stack: error.stack, processingTime: `${processingTime}ms`, body: req.body });
    res.status(500).json({
      success: false,
      message: 'Registration failed',
      error: NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Business validation function
async function performBusinessValidation(data) {
  const errors = [];
  try {
    const today = new Date();
    const birthDate = new Date(data.dateOfBirth);
    const age = Math.floor((today - birthDate) / (365.25 * 24 * 60 * 60 * 1000));
    if (age < 16) {
      errors.push({ field: 'dateOfBirth', message: 'Guest must be at least 16 years old to register', code: 'MIN_AGE_VIOLATION' });
    }
    if (age > 120) {
      errors.push({ field: 'dateOfBirth', message: 'Please enter a valid date of birth', code: 'INVALID_AGE' });
    }

    const isDuplicate = await checkDuplicateGuest(data.idNumber);
    if (isDuplicate) {
      errors.push({ field: 'idNumber', message: 'A guest with this ID number is already registered', code: 'DUPLICATE_ID' });
    }
    // Aadhaar-specific validation removed
  } catch (error) {
    logger.error('Business validation error:', error);
    errors.push({ field: 'general', message: 'Validation service temporarily unavailable', code: 'VALIDATION_ERROR' });
  }
  return errors;
}


// Duplicate guest check
async function checkDuplicateGuest(idNumber) {
  try {
    const existing = await Guest.findOne({ idNumber });
    return !!existing;
  } catch (error) {
    logger.error('Error checking for duplicate guest:', error);
    return false;
  }
}

// Register guest
async function registerGuest(data, ip) {
  try {
    const guestId = generateGuestId();
    const guest = new Guest({ ...data, registeredAt: new Date(), registeredFrom: ip, status: 'active', version: '1.0.0' });
    await guest.save();
    logger.info('Guest data saved successfully in MongoDB', { guestId: guest._id });
    return guest._id;
  } catch (error) {
    logger.error('Error registering guest:', error);
    throw new Error('Failed to save guest registration');
  }
}

// Generate unique guest ID
function generateGuestId() {
  return `PC-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
}

// Get all guests (Admin only)
app.get('/api/guests', async (req, res) => {
  const adminToken = req.headers['x-admin-token'];
  if (!adminToken || adminToken !== process.env.ADMIN_TOKEN) {
    return res.status(403).json({ success: false, message: 'Forbidden: Invalid or missing admin token' });
  }
  try {
    const guests = await Guest.find({}, 'fullName registeredAt status');
    const publicGuests = guests.map(g => ({ id: g._id, fullName: g.fullName, registeredAt: g.registeredAt, status: g.status }));
    res.json({ success: true, data: publicGuests, count: publicGuests.length, timestamp: new Date().toISOString() });
  } catch (error) {
    logger.error('Error fetching guests:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch guest data' });
  }
});


// --- FIX #2: Restore the SPA fallback to serve index.html for non-API, non-file routes ---
// This should come AFTER all your API routes but BEFORE your 404 handler.
app.get('*', (req, res, next) => {
    // If the request is not for an API route, serve the index.html file.
    if (!req.originalUrl.startsWith('/api')) {
        return res.sendFile(path.join(process.cwd(), 'public/index.html'));
    }
    // If it is an API route, pass it to the next handler (the 404 handler in this case)
    next();
});


// Error handler middleware
app.use((error, req, res, next) => {
  logger.error('Unhandled application error:', { error: error.message, stack: error.stack, url: req.originalUrl, method: req.method, ip: req.ip });
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: NODE_ENV === 'development' ? error.message : 'Something went wrong',
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use((req, res, next) => {
  // This will now correctly catch API routes that don't exist
  logger.warn('404 - API route not found', { url: req.originalUrl, method: req.method, ip: req.ip });
  res.status(404).json({
    success: false,
    message: 'API endpoint not found',
    path: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString()
  });
});

// Graceful shutdown [FIXED]
const gracefulShutdown = (signal) => {
  logger.info(`Received ${signal}, starting graceful shutdown...`);

  // 1. Close the HTTP server
  if (server) {
    server.close(() => {
      logger.info('HTTP server closed.');
      // 2. Close the MongoDB connection
      mongoose.connection.close(false, () => {
        logger.info('MongoDB connection closed.');
        process.exit(0);
      });
    });
  } else {
    // If server isn't running, just exit
    logger.info('Server not started, exiting immediately.');
    process.exit(0);
  }

  // Force shutdown after a timeout
  setTimeout(() => {
    logger.error('Could not close connections in time, forcefully shutting down.');
    process.exit(1);
  }, 10000); // 10-second timeout
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Start Server
const startServer = async () => {
  try {
    await ensureDirectories();
    await connectDB();
    server = app.listen(PORT, '0.0.0.0', () => {
      logger.info('🚀 ProCheck OCR System started successfully!');
      logger.info(`📍 Server running on: http://localhost:${PORT}`);
      logger.info(`🔧 Environment: ${NODE_ENV}`);
      logger.info(`💚 Health Check: http://localhost:${PORT}/api/health`);
    });
    module.exports.server = server;
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

module.exports = app;