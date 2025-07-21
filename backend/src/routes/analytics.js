const express = require('express');
const database = require('../database/connection');
const logger = require('../utils/logger');

const router = express.Router();

/**
 * GET /api/analytics
 * Get system analytics and insights
 */
router.get('/', async (req, res) => {
  try {
    const { period = '30d' } = req.query;

    // Calculate date range
    const now = new Date();
    let startDate;
    
    switch (period) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    // Get overall statistics
    const overallStats = await database.get(`
      SELECT 
        (SELECT COUNT(*) FROM talents) as total_talents,
        (SELECT COUNT(*) FROM clients) as total_clients,
        (SELECT COUNT(*) FROM gigs) as total_gigs,
        (SELECT COUNT(*) FROM matches) as total_matches
    `);

    // Get recent activity (simplified)
    const recentGigs = await database.all(`
      SELECT 
        'gig' as type,
        g.id,
        g.title,
        g.created_at,
        c.name as client_name
      FROM gigs g
      LEFT JOIN clients c ON g.client_id = c.id
      WHERE g.created_at >= $1
      ORDER BY g.created_at DESC
      LIMIT 5
    `, [startDate.toISOString()]);

    const recentMatches = await database.all(`
      SELECT 
        'match' as type,
        m.id,
        'Match for gig ' || m.gig_id as title,
        m.created_at,
        t.name as client_name
      FROM matches m
      JOIN talents t ON m.talent_id = t.id
      WHERE m.created_at >= $1
      ORDER BY m.created_at DESC
      LIMIT 5
    `, [startDate.toISOString()]);

    const recentActivity = [...recentGigs, ...recentMatches]
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 10);

    // Get top performing categories
    const topCategories = await database.all(`
      SELECT 
        g.category,
        COUNT(*) as gig_count,
        COUNT(DISTINCT g.client_id) as unique_clients,
        AVG(g.budget) as avg_budget
      FROM gigs g
      WHERE g.created_at >= ?
      GROUP BY g.category
      ORDER BY gig_count DESC
      LIMIT 5
    `, [startDate.toISOString()]);

    // Get talent distribution
    const talentDistribution = await database.all(`
      SELECT 
        city,
        COUNT(*) as talent_count,
        AVG(experience_years) as avg_experience,
        AVG(budget_max) as avg_budget
      FROM talents
      WHERE city IS NOT NULL
      GROUP BY city
      ORDER BY talent_count DESC
      LIMIT 10
    `);

    // Get match success rates
    const matchSuccess = await database.get(`
      SELECT 
        COUNT(*) as total_matches,
        COUNT(CASE WHEN final_decision = 'selected' THEN 1 END) as selected_count,
        COUNT(CASE WHEN final_decision = 'rejected' THEN 1 END) as rejected_count,
        COUNT(CASE WHEN final_decision = 'backup' THEN 1 END) as backup_count,
        AVG(score) as avg_score
      FROM matches
      WHERE created_at >= ?
    `, [startDate.toISOString()]);

    res.json({
      success: true,
      data: {
        period,
        overview: {
          total_talents: overallStats.total_talents,
          total_clients: overallStats.total_clients,
          total_gigs: overallStats.total_gigs,
          total_matches: overallStats.total_matches
        },
        recent_activity: recentActivity,
        top_categories: topCategories,
        talent_distribution: talentDistribution,
        match_success: {
          total_matches: matchSuccess.total_matches,
          selection_rate: matchSuccess.total_matches > 0 ? 
            Math.round((matchSuccess.selected_count / matchSuccess.total_matches) * 100) : 0,
          average_score: Math.round(matchSuccess.avg_score * 100) / 100,
          decisions: {
            selected: matchSuccess.selected_count,
            rejected: matchSuccess.rejected_count,
            backup: matchSuccess.backup_count
          }
        }
      }
    });

  } catch (error) {
    logger.error('Error fetching analytics:', error);
    res.status(500).json({
      error: 'Failed to fetch analytics',
      message: error.message
    });
  }
});

/**
 * GET /api/analytics/performance
 * Get system performance metrics
 */
router.get('/performance', async (req, res) => {
  try {
    // Get database performance metrics
    const dbStats = await database.get(`
      SELECT 
        COUNT(*) as total_records,
        (SELECT COUNT(*) FROM talents) as talents,
        (SELECT COUNT(*) FROM clients) as clients,
        (SELECT COUNT(*) FROM gigs) as gigs,
        (SELECT COUNT(*) FROM matches) as matches
      FROM sqlite_master 
      WHERE type='table'
    `);

    // Get recent matchmaking performance
    const recentMatches = await database.all(`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as match_count,
        AVG(score) as avg_score,
        COUNT(CASE WHEN final_decision = 'selected' THEN 1 END) as selected_count
      FROM matches
      WHERE created_at >= DATE('now', '-7 days')
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `);

    res.json({
      success: true,
      data: {
        database: {
          total_records: dbStats.total_records,
          table_counts: {
            talents: dbStats.talents,
            clients: dbStats.clients,
            gigs: dbStats.gigs,
            matches: dbStats.matches
          }
        },
        matchmaking_performance: {
          daily_stats: recentMatches,
          total_matches_week: recentMatches.reduce((sum, day) => sum + day.match_count, 0),
          avg_score_week: recentMatches.length > 0 ? 
            Math.round(recentMatches.reduce((sum, day) => sum + day.avg_score, 0) / recentMatches.length * 100) / 100 : 0
        }
      }
    });

  } catch (error) {
    logger.error('Error fetching performance metrics:', error);
    res.status(500).json({
      error: 'Failed to fetch performance metrics',
      message: error.message
    });
  }
});

module.exports = router; 