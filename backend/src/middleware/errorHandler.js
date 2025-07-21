const logger = require('../utils/logger');

// Custom error classes
class ValidationError extends Error {
  constructor(message, details) {
    super(message);
    this.name = 'ValidationError';
    this.statusCode = 400;
    this.details = details;
  }
}

class NotFoundError extends Error {
  constructor(resource) {
    super(`${resource} not found`);
    this.name = 'NotFoundError';
    this.statusCode = 404;
  }
}

class DatabaseError extends Error {
  constructor(message, originalError) {
    super(message);
    this.name = 'DatabaseError';
    this.statusCode = 500;
    this.originalError = originalError;
  }
}

class MatchmakingError extends Error {
  constructor(message, gigId) {
    super(message);
    this.name = 'MatchmakingError';
    this.statusCode = 500;
    this.gigId = gigId;
  }
}

// Error handler middleware
function errorHandler(err, req, res, next) {
  // Log the error
  logger.error('Error occurred:', {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString()
  });

  // Handle known error types
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      error: 'Validation Error',
      message: err.message,
      details: err.details
    });
  }

  if (err.name === 'NotFoundError') {
    return res.status(404).json({
      success: false,
      error: 'Not Found',
      message: err.message
    });
  }

  if (err.name === 'DatabaseError') {
    return res.status(500).json({
      success: false,
      error: 'Database Error',
      message: 'An error occurred while accessing the database'
    });
  }

  if (err.name === 'MatchmakingError') {
    return res.status(500).json({
      success: false,
      error: 'Matchmaking Error',
      message: err.message,
      gigId: err.gigId
    });
  }

  // Handle Joi validation errors
  if (err.isJoi) {
    return res.status(400).json({
      success: false,
      error: 'Validation Error',
      message: 'Invalid request data',
      details: err.details.map(d => d.message)
    });
  }

  // Handle SQLite errors
  if (err.code === 'SQLITE_CONSTRAINT') {
    return res.status(400).json({
      success: false,
      error: 'Constraint Error',
      message: 'Data constraint violation'
    });
  }

  // Default error response
  const statusCode = err.statusCode || 500;
  const message = statusCode === 500 ? 'Internal Server Error' : err.message;

  res.status(statusCode).json({
    success: false,
    error: 'Server Error',
    message: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
}

// Async error wrapper
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

// Request timeout middleware
function timeoutHandler(timeout = 30000) {
  return (req, res, next) => {
    const timer = setTimeout(() => {
      res.status(408).json({
        success: false,
        error: 'Request Timeout',
        message: 'Request took too long to process'
      });
    }, timeout);

    res.on('finish', () => {
      clearTimeout(timer);
    });

    next();
  };
}

module.exports = {
  errorHandler,
  asyncHandler,
  timeoutHandler,
  ValidationError,
  NotFoundError,
  DatabaseError,
  MatchmakingError
}; 