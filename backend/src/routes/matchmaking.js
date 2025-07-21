const express = require('express');
const router = express.Router();
const EnhancedMatchmakingEngine = require('../services/EnhancedMatchmakingEngine');
const GaleShapleyMatcher = require('../services/GaleShapleyMatcher');
const SemanticMatcher = require('../services/SemanticMatcher');
const db = require('../database/connection');
const logger = require('../utils/logger');

const matchmakingEngine = new EnhancedMatchmakingEngine();
const galeShapleyMatcher = new GaleShapleyMatcher();
const semanticMatcher = new SemanticMatcher();

// Generate matches for a gig
router.post('/match', async (req, res) => {
  try {
    const { gig_id, preferences, limit = 10, algorithm = 'auto' } = req.body;
    
    if (!gig_id && !preferences) {
      return res.status(400).json({
        success: false,
        error: 'Either gig_id or preferences must be provided'
      });
    }

    let gig, matches, metadata;

    if (preferences) {
      // Preference-based matching
      logger.info('Starting preference-based matching', { preferences, algorithm });
      
      // Create a virtual gig from preferences
      gig = {
        id: 'virtual-gig-' + Date.now(),
        title: `${preferences.profession} - ${preferences.category}`,
        description: preferences.project_description || `Looking for ${preferences.profession} for ${preferences.category}`,
        category: preferences.category,
        budget: (preferences.budget_range.min + preferences.budget_range.max) / 2,
        location: preferences.location,
        timeline: preferences.timeline,
        requirements: preferences.required_skills,
        style_tags: preferences.style_tags,
        expectation_level: preferences.experience_level,
        status: 'open'
      };

      // Get talents that match preferences
      const talentQuery = `
        SELECT * FROM talents 
        WHERE categories LIKE $1 
        AND city LIKE $2 
        AND budget_min <= $3 
        AND budget_max >= $4
        AND experience_years >= $5
        AND rating >= $6
        ${preferences.remote ? '' : 'AND availability = 1'}
        LIMIT $7
      `;

      const experienceYears = preferences.experience_level === 'Beginner' ? 0 : 
                             preferences.experience_level === 'Intermediate' ? 2 : 5;

      const [talents] = await db.execute(talentQuery, [
        `%${preferences.profession}%`,
        `%${preferences.location}%`,
        preferences.budget_range.max,
        preferences.budget_range.min,
        experienceYears,
        preferences.rating,
        limit * 3 // Get more candidates for better matching
      ]);

      if (talents.length === 0) {
        return res.json({
          success: true,
          data: {
            gig,
            matches: [],
            metadata: {
              totalProposers: 1,
              totalReviewers: 0,
              matchedProposers: 0,
              matchedReviewers: 0,
              processingTimeMs: 0,
              algorithm: algorithm,
              stability: 'not-guaranteed',
              totalCandidates: 0
            }
          }
        });
      }

      // Generate matches using the selected algorithm
      const result = await matchmakingEngine.findMatches(gig, {
        limit,
        algorithm,
        candidates: talents,
        preferences
      });

      matches = result.matches;
      metadata = result.metadata;

    } else {
      // Existing gig-based matching
      logger.info('Starting gig-based matching', { gig_id, algorithm });
      
      const [gigs] = await db.execute('SELECT * FROM gigs WHERE id = $1', [gig_id]);
      if (gigs.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Gig not found'
        });
      }
      
      gig = gigs[0];
      const result = await matchmakingEngine.findMatches(gig_id, {
        limit,
        algorithm
      });
      
      matches = result.matches;
      metadata = result.metadata;
    }

    // Save matches to database
    for (const match of matches) {
      await db.execute(`
        INSERT INTO matches (gig_id, talent_id, score, rank, algorithm_type, match_type, stability_verified, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
      `, [
        gig.id,
        match.talent.id,
        match.score,
        match.rank,
        metadata.algorithm,
        match.match_type || 'ranked',
        match.stability_verified || false
      ]);
    }

    res.json({
      success: true,
      data: {
        gig,
        matches,
        metadata
      }
    });

  } catch (error) {
    logger.error('Error in match generation:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate matches',
      details: error.message
    });
  }
});

// Get matches for a specific gig
router.get('/gig/:gigId/matches', async (req, res) => {
  try {
    const { gigId } = req.params;
    const { limit = 10, offset = 0, status, algorithm_type } = req.query;

    let query = `
      SELECT m.*, t.*, g.title as gig_title
      FROM matches m
      JOIN talents t ON m.talent_id = t.id
      JOIN gigs g ON m.gig_id = g.id
      WHERE m.gig_id = $1
    `;
    
    const params = [gigId];
    
    if (status) {
      query += ' AND m.status = $2';
      params.push(status);
    }
    
    if (algorithm_type) {
      query += ' AND m.algorithm_type = $3';
      params.push(algorithm_type);
    }
    
    query += ' ORDER BY m.score DESC LIMIT $4 OFFSET $5';
    params.push(parseInt(limit), parseInt(offset));

    const [matches] = await db.execute(query, params);

    // Transform matches to frontend format
    const transformedMatches = matches.map(match => ({
      talent: {
        id: match.talent_id,
        name: match.name,
        email: match.email,
        category: match.categories,
        experience: `${match.experience_years} years`,
        location: match.city,
        hourlyRate: Math.floor(match.budget_min / 8),
        skills: match.skills ? match.skills.split(',') : [],
        rating: match.rating || 4.5,
        style_tags: match.style_tags ? JSON.parse(match.style_tags) : []
      },
      score: match.score,
      rank: match.rank,
      algorithm: match.algorithm_type,
      match_type: match.match_type,
      stability_verified: match.stability_verified,
      created_at: match.created_at
    }));

    res.json({
      success: true,
      data: {
        matches: transformedMatches,
        pagination: {
          total: matches.length,
          limit: parseInt(limit),
          offset: parseInt(offset)
        }
      }
    });

  } catch (error) {
    logger.error('Error fetching gig matches:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch matches'
    });
  }
});

// Submit feedback for a match
router.post('/feedback', async (req, res) => {
  try {
    const { match_id, rating, feedback, decision } = req.body;

    await db.execute(`
      UPDATE matches 
      SET feedback_rating = $1, feedback_text = $2, decision = $3, updated_at = NOW()
      WHERE id = $4
    `, [rating, feedback, decision, match_id]);

    res.json({
      success: true,
      message: 'Feedback submitted successfully'
    });

  } catch (error) {
    logger.error('Error submitting feedback:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to submit feedback'
    });
  }
});

// Get algorithm information
router.get('/algorithm/info', (req, res) => {
  res.json({
    success: true,
    data: {
      name: 'Enhanced Matchmaking Engine',
      version: '2.0.0',
      algorithms: {
        primary: 'Gale-Shapley with AI Enhancement',
        fallback: 'Legacy Hybrid Algorithm',
        galeShapley: {
          algorithm: 'Gale-Shapley Stable Matching',
          complexity: 'O(n²)',
          stability: 'Guaranteed',
          optimality: 'Optimal for proposers',
          truthfulness: 'Strategy-proof for proposers',
          references: [
            'Gale, D., & Shapley, L. S. (1962). College Admissions and the Stability of Marriage',
            'Roth, A. E., & Sotomayor, M. (1990). Two-Sided Matching: A Study in Game-Theoretic Modeling and Analysis'
          ]
        }
      },
      features: [
        'AI-powered semantic matching',
        'Stable matching guarantees',
        'Hybrid scoring system',
        'Fallback mechanisms',
        'Real-time processing'
      ],
      configuration: {
        useGaleShapley: process.env.USE_GALE_SHAPLEY === 'true',
        maxCandidates: parseInt(process.env.MAX_CANDIDATES) || 50,
        minScore: parseInt(process.env.MIN_SCORE) || 30,
        debugMode: process.env.DEBUG_MODE === 'true'
      }
    }
  });
});

// Verify algorithm for a specific gig
router.post('/algorithm/verify', async (req, res) => {
  try {
    const { gig_id, options = {} } = req.body;

    const [gigs] = await db.execute('SELECT * FROM gigs WHERE id = $1', [gig_id]);
    if (gigs.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Gig not found'
      });
    }

    const gig = gigs[0];
    const verification = await galeShapleyMatcher.verifyStability(gig, options);

    res.json({
      success: true,
      data: verification
    });

  } catch (error) {
    logger.error('Error in algorithm verification:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to verify algorithm'
    });
  }
});

// Get matchmaking statistics
router.get('/stats', async (req, res) => {
  try {
    const [totalMatches] = await db.execute('SELECT COUNT(*) as count FROM matches');
    const [algorithmStats] = await db.execute(`
      SELECT algorithm_type, COUNT(*) as count, AVG(score) as avg_score
      FROM matches 
      GROUP BY algorithm_type
    `);
    const [recentMatches] = await db.execute(`
      SELECT COUNT(*) as count 
      FROM matches 
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
    `);

    res.json({
      success: true,
      data: {
        totalMatches: totalMatches[0].count,
        algorithmStats,
        recentMatches: recentMatches[0].count,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    logger.error('Error fetching matchmaking stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch statistics'
    });
  }
});

// Get matchmaking health status
router.get('/health', async (req, res) => {
  try {
    const aiStatus = await semanticMatcher.checkStatus();
    const [dbStatus] = await db.execute('SELECT 1 as status');
    
    const health = {
      status: 'healthy',
      components: {
        database: dbStatus.length > 0 ? 'healthy' : 'unhealthy',
        ai: aiStatus.available ? 'healthy' : 'degraded',
        algorithm: 'healthy'
      },
      timestamp: new Date().toISOString()
    };

    res.json({
      success: true,
      data: health
    });

  } catch (error) {
    logger.error('Error in health check:', error);
    res.status(500).json({
      success: false,
      error: 'Health check failed'
    });
  }
});

module.exports = router; 