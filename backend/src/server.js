require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');

const database = require('./database/connection');
const logger = require('./utils/logger');
const DataSeeder = require('./database/seed');
const migrate = require('./database/migrate');

// Import routes
const talentRoutes = require('./routes/talents');
const clientRoutes = require('./routes/clients');
const gigRoutes = require('./routes/gigs');
const matchmakingRoutes = require('./routes/matchmaking');
const aiRoutes = require('./routes/ai');
const analyticsRoutes = require('./routes/analytics');
const healthRoutes = require('./routes/health');

const app = express();
app.set('trust proxy', 1); // trust first proxy for rate limiting and real IPs
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false, // Disable for development
  crossOriginEmbedderPolicy: false
}));

// CORS configuration
const corsOrigins = process.env.CORS_ORIGIN 
  ? process.env.CORS_ORIGIN.split(',').map(origin => origin.trim())
  : ['http://localhost:3000', 'http://localhost:3001'];

app.use(cors({
  origin: corsOrigins,
  credentials: true
}));

// Rate limiting
const rateLimit = require('express-rate-limit');
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', limiter);

// Compression
app.use(compression());

// Logging
app.use(morgan('combined', { stream: { write: message => logger.http(message.trim()) } }));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check routes
app.use('/api/health', healthRoutes);

// API routes
app.use('/api/talents', talentRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/gigs', gigRoutes);
app.use('/api/matchmaking', matchmakingRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/analytics', analyticsRoutes);

// API documentation endpoint
app.get('/api', (req, res) => {
  res.json({
    name: 'BreadButter Talent Matchmaking API',
    version: '1.0.0',
    description: 'Advanced talent matchmaking engine with AI-powered recommendations',
    endpoints: {
      health: 'GET /health',
      talents: 'GET,POST /api/talents',
      clients: 'GET,POST /api/clients',
      gigs: 'GET,POST /api/gigs',
      matchmaking: 'POST /api/matchmaking/match',
      ai: 'GET /api/ai/status',
      analytics: 'GET /api/analytics'
    },
    documentation: {
      algorithm: 'Hybrid rule-based + semantic matching',
      features: [
        'Location-based filtering',
        'Budget compatibility scoring',
        'Skill and category matching',
        'Experience level assessment',
        'AI-powered style similarity',
        'Semantic brief matching',
        'Availability checking',
        'Feedback loop integration'
      ]
    }
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    path: req.originalUrl,
    method: req.method
  });
});

// Global error handler
app.use((error, req, res, next) => {
  logger.error('Unhandled error:', error);
  
  const statusCode = error.statusCode || 500;
  const message = error.message || 'Internal server error';
  
  res.status(statusCode).json({
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  });
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  await database.disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully');
  await database.disconnect();
  process.exit(0);
});

// Start server
async function startServer() {
  try {
    // Connect to database
    await database.connect();

    // Run migrations
    await migrate();

    // Seed data if needed
    const seeder = new DataSeeder();
    await seeder.seedIfNeeded();

    // Start listening
    app.listen(PORT, () => {
      logger.info(`🚀 BreadButter API server running on port ${PORT}`);
      logger.info(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`🔗 Health check: http://localhost:${PORT}/api/health`);
      logger.info(`📚 API docs: http://localhost:${PORT}/api`);
    });

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server
startServer();

module.exports = app; 