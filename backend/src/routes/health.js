const express = require('express');
const database = require('../database/connection');
const logger = require('../utils/logger');
const cacheService = require('../services/CacheService');
const jobQueue = require('../services/JobQueue');

const router = express.Router();

/**
 * GET /api/health
 * Basic health check
 */
router.get('/', async (req, res) => {
  try {
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development'
    };

    res.json({
      success: true,
      data: health
    });
  } catch (error) {
    logger.error('Health check failed:', error);
    res.status(500).json({
      success: false,
      error: 'Health check failed',
      message: error.message
    });
  }
});

/**
 * GET /api/health/detailed
 * Detailed health check with all services
 */
router.get('/detailed', async (req, res) => {
  try {
    const startTime = Date.now();
    const checks = {};

    // Database health check
    try {
      const dbStart = Date.now();
      await database.get('SELECT 1 as test');
      checks.database = {
        status: 'healthy',
        responseTime: Date.now() - dbStart,
        connection: 'active'
      };
    } catch (error) {
      checks.database = {
        status: 'unhealthy',
        error: error.message,
        connection: 'failed'
      };
    }

    // Cache health check
    try {
      const cacheStart = Date.now();
      const testKey = 'health_check_test';
      await cacheService.set(testKey, { test: true }, 60);
      const cached = await cacheService.get(testKey);
      await cacheService.del(testKey);
      
      checks.cache = {
        status: cached ? 'healthy' : 'unhealthy',
        responseTime: Date.now() - cacheStart,
        connection: cacheService.isConnected ? 'active' : 'inactive'
      };
    } catch (error) {
      checks.cache = {
        status: 'unhealthy',
        error: error.message,
        connection: 'failed'
      };
    }

    // Job queue health check
    checks.jobQueue = {
      status: 'healthy',
      activeJobs: jobQueue.activeJobs,
      pendingJobs: Array.from(jobQueue.jobs.values()).filter(j => j.status === 'pending').length,
      totalJobs: jobQueue.jobs.size,
      maxConcurrentJobs: jobQueue.maxConcurrentJobs
    };

    // Memory usage
    const memUsage = process.memoryUsage();
    checks.memory = {
      status: 'healthy',
      rss: Math.round(memUsage.rss / 1024 / 1024) + ' MB',
      heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024) + ' MB',
      heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024) + ' MB',
      external: Math.round(memUsage.external / 1024 / 1024) + ' MB'
    };

    // System info
    checks.system = {
      status: 'healthy',
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
      pid: process.pid,
      uptime: Math.round(process.uptime()) + ' seconds'
    };

    // Overall status
    const overallStatus = Object.values(checks).every(check => 
      check.status === 'healthy'
    ) ? 'healthy' : 'degraded';

    const response = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      responseTime: Date.now() - startTime,
      checks
    };

    const statusCode = overallStatus === 'healthy' ? 200 : 503;
    res.status(statusCode).json({
      success: overallStatus === 'healthy',
      data: response
    });

  } catch (error) {
    logger.error('Detailed health check failed:', error);
    res.status(500).json({
      success: false,
      error: 'Health check failed',
      message: error.message
    });
  }
});

/**
 * GET /api/health/ready
 * Readiness probe for Kubernetes
 */
router.get('/ready', async (req, res) => {
  try {
    // Check database connectivity
    await database.get('SELECT 1 as test');
    
    res.status(200).json({
      success: true,
      status: 'ready',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Readiness check failed:', error);
    res.status(503).json({
      success: false,
      status: 'not ready',
      error: error.message
    });
  }
});

/**
 * GET /api/health/live
 * Liveness probe for Kubernetes
 */
router.get('/live', (req, res) => {
  res.status(200).json({
    success: true,
    status: 'alive',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

/**
 * GET /api/health/metrics
 * Prometheus-style metrics
 */
router.get('/metrics', async (req, res) => {
  try {
    const metrics = [];

    // System metrics
    const memUsage = process.memoryUsage();
    metrics.push(`# HELP node_memory_rss_bytes Resident memory size in bytes`);
    metrics.push(`# TYPE node_memory_rss_bytes gauge`);
    metrics.push(`node_memory_rss_bytes ${memUsage.rss}`);

    metrics.push(`# HELP node_memory_heap_used_bytes Heap memory used in bytes`);
    metrics.push(`# TYPE node_memory_heap_used_bytes gauge`);
    metrics.push(`node_memory_heap_used_bytes ${memUsage.heapUsed}`);

    metrics.push(`# HELP node_uptime_seconds Node.js uptime in seconds`);
    metrics.push(`# TYPE node_uptime_seconds gauge`);
    metrics.push(`node_uptime_seconds ${process.uptime()}`);

    // Application metrics
    metrics.push(`# HELP app_job_queue_size Number of jobs in queue`);
    metrics.push(`# TYPE app_job_queue_size gauge`);
    metrics.push(`app_job_queue_size ${jobQueue.jobs.size}`);

    metrics.push(`# HELP app_job_queue_active Number of active jobs`);
    metrics.push(`# TYPE app_job_queue_active gauge`);
    metrics.push(`app_job_queue_active ${jobQueue.activeJobs}`);

    // Database metrics
    try {
      const dbStart = Date.now();
      await database.get('SELECT 1 as test');
      const dbResponseTime = Date.now() - dbStart;
      
      metrics.push(`# HELP app_database_response_time_ms Database response time in milliseconds`);
      metrics.push(`# TYPE app_database_response_time_ms gauge`);
      metrics.push(`app_database_response_time_ms ${dbResponseTime}`);
      
      metrics.push(`# HELP app_database_healthy Database health status`);
      metrics.push(`# TYPE app_database_healthy gauge`);
      metrics.push(`app_database_healthy 1`);
    } catch (error) {
      metrics.push(`# HELP app_database_healthy Database health status`);
      metrics.push(`# TYPE app_database_healthy gauge`);
      metrics.push(`app_database_healthy 0`);
    }

    res.set('Content-Type', 'text/plain');
    res.send(metrics.join('\n'));

  } catch (error) {
    logger.error('Metrics generation failed:', error);
    res.status(500).send('# Error generating metrics\n');
  }
});

module.exports = router; 