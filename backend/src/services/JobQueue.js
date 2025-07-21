const logger = require('../utils/logger');
const cron = require('node-cron');

class JobQueue {
  constructor() {
    this.jobs = new Map();
    this.isProcessing = false;
    this.maxConcurrentJobs = parseInt(process.env.MAX_CONCURRENT_JOBS) || 5;
    this.activeJobs = 0;
  }

  // Add a job to the queue
  async addJob(jobType, data, priority = 'normal') {
    const jobId = this.generateJobId();
    const job = {
      id: jobId,
      type: jobType,
      data,
      priority,
      status: 'pending',
      createdAt: new Date(),
      startedAt: null,
      completedAt: null,
      result: null,
      error: null
    };

    this.jobs.set(jobId, job);
    logger.info(`Job added to queue: ${jobType}`, { jobId, priority });

    // Process jobs if not already processing
    if (!this.isProcessing) {
      this.processJobs();
    }

    return jobId;
  }

  // Process jobs in the queue
  async processJobs() {
    if (this.isProcessing || this.activeJobs >= this.maxConcurrentJobs) {
      return;
    }

    this.isProcessing = true;

    try {
      const pendingJobs = Array.from(this.jobs.values())
        .filter(job => job.status === 'pending')
        .sort((a, b) => this.getPriorityWeight(b.priority) - this.getPriorityWeight(a.priority));

      for (const job of pendingJobs) {
        if (this.activeJobs >= this.maxConcurrentJobs) break;

        this.activeJobs++;
        this.executeJob(job);
      }
    } finally {
      this.isProcessing = false;
    }
  }

  // Execute a specific job
  async executeJob(job) {
    job.status = 'running';
    job.startedAt = new Date();

    try {
      logger.info(`Executing job: ${job.type}`, { jobId: job.id });

      switch (job.type) {
        case 'ai_embedding_generation':
          job.result = await this.generateAIEmbeddings(job.data);
          break;
        case 'analytics_generation':
          job.result = await this.generateAnalytics(job.data);
          break;
        case 'match_optimization':
          job.result = await this.optimizeMatches(job.data);
          break;
        case 'data_cleanup':
          job.result = await this.cleanupData(job.data);
          break;
        default:
          throw new Error(`Unknown job type: ${job.type}`);
      }

      job.status = 'completed';
      job.completedAt = new Date();
      logger.info(`Job completed: ${job.type}`, { jobId: job.id });

    } catch (error) {
      job.status = 'failed';
      job.error = error.message;
      job.completedAt = new Date();
      logger.error(`Job failed: ${job.type}`, { jobId: job.id, error: error.message });
    } finally {
      this.activeJobs--;
      
      // Continue processing if there are more jobs
      if (this.jobs.size > 0) {
        setTimeout(() => this.processJobs(), 100);
      }
    }
  }

  // Get job status
  getJobStatus(jobId) {
    return this.jobs.get(jobId) || null;
  }

  // Get all jobs
  getAllJobs() {
    return Array.from(this.jobs.values());
  }

  // Clean up completed jobs
  cleanupCompletedJobs(maxAge = 24 * 60 * 60 * 1000) { // 24 hours
    const cutoff = new Date(Date.now() - maxAge);
    const toDelete = [];

    for (const [jobId, job] of this.jobs.entries()) {
      if (job.completedAt && job.completedAt < cutoff) {
        toDelete.push(jobId);
      }
    }

    toDelete.forEach(jobId => this.jobs.delete(jobId));
    logger.info(`Cleaned up ${toDelete.length} completed jobs`);
  }

  // Job type implementations
  async generateAIEmbeddings(data) {
    // Simulate AI embedding generation
    await new Promise(resolve => setTimeout(resolve, 2000));
    return { embeddingsGenerated: data.count || 1 };
  }

  async generateAnalytics(data) {
    // Simulate analytics generation
    await new Promise(resolve => setTimeout(resolve, 1000));
    return { analyticsGenerated: true, period: data.period };
  }

  async optimizeMatches(data) {
    // Simulate match optimization
    await new Promise(resolve => setTimeout(resolve, 3000));
    return { matchesOptimized: data.gigId };
  }

  async cleanupData(data) {
    // Simulate data cleanup
    await new Promise(resolve => setTimeout(resolve, 500));
    return { recordsCleaned: data.count || 0 };
  }

  // Utility methods
  generateJobId() {
    return `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  getPriorityWeight(priority) {
    const weights = { high: 3, normal: 2, low: 1 };
    return weights[priority] || 2;
  }

  // Start scheduled jobs
  startScheduledJobs() {
    // Clean up completed jobs every hour
    cron.schedule('0 * * * *', () => {
      this.cleanupCompletedJobs();
    });

    // Generate daily analytics at 2 AM
    cron.schedule('0 2 * * *', async () => {
      await this.addJob('analytics_generation', { period: 'daily' }, 'low');
    });

    // Data cleanup every day at 3 AM
    cron.schedule('0 3 * * *', async () => {
      await this.addJob('data_cleanup', { count: 1000 }, 'low');
    });

    logger.info('Scheduled jobs started');
  }
}

module.exports = new JobQueue(); 