const express = require('express');
const database = require('../database/connection');
const logger = require('../utils/logger');

const router = express.Router();

/**
 * GET /api/gigs
 * List gigs with filtering and pagination
 */
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 20, category, city, status, client_id } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let paramIndex = 1;
    let query = `
      SELECT g.*, c.name as client_name, c.industry as client_industry
      FROM gigs g
      LEFT JOIN clients c ON g.client_id = c.id
      WHERE 1=1
    `;
    const params = [];

    if (category) {
      query += ` AND g.category = $${paramIndex++}`;
      params.push(category);
    }

    if (city) {
      query += ` AND g.city = $${paramIndex++}`;
      params.push(city);
    }

    if (status) {
      query += ` AND g.status = $${paramIndex++}`;
      params.push(status);
    }

    if (client_id) {
      query += ` AND g.client_id = $${paramIndex++}`;
      params.push(client_id);
    }

    // Get total count
    const countQuery = query.replace('SELECT g.*, c.name as client_name, c.industry as client_industry', 'SELECT COUNT(*) as total');
    const countResult = await database.get(countQuery, params);

    // Add pagination
    query += ` ORDER BY g.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(parseInt(limit), offset);

    const gigs = await database.all(query, params);

    // Enrich gig data
    const enrichedGigs = await Promise.all(
      gigs.map(async (gig) => {
        // Get style tags
        const styleTags = await database.all(
          'SELECT style_tag FROM gig_style_tags WHERE gig_id = ?',
          [gig.id]
        );

        return {
          ...gig,
          style_tags: styleTags.map(st => st.style_tag),
          style_tags_json: database.parseJsonField(gig.style_tags)
        };
      })
    );

    res.json({
      success: true,
      data: enrichedGigs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: countResult.total,
        totalPages: Math.ceil(countResult.total / parseInt(limit))
      }
    });

  } catch (error) {
    logger.error('Error fetching gigs:', error);
    res.status(500).json({
      error: 'Failed to fetch gigs',
      message: error.message
    });
  }
});

/**
 * GET /api/gigs/:id
 * Get a specific gig by ID
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const gig = await database.get(`
      SELECT g.*, c.name as client_name, c.industry as client_industry
      FROM gigs g
      LEFT JOIN clients c ON g.client_id = c.id
      WHERE g.id = ?
    `, [id]);

    if (!gig) {
      return res.status(404).json({
        error: 'Gig not found',
        message: `Gig with ID ${id} does not exist`
      });
    }

    // Get style tags
    const styleTags = await database.all(
      'SELECT style_tag FROM gig_style_tags WHERE gig_id = ?',
      [id]
    );

    const enrichedGig = {
      ...gig,
      style_tags: styleTags.map(st => st.style_tag),
      style_tags_json: database.parseJsonField(gig.style_tags)
    };

    res.json({
      success: true,
      data: enrichedGig
    });

  } catch (error) {
    logger.error('Error fetching gig:', error);
    res.status(500).json({
      error: 'Failed to fetch gig',
      message: error.message
    });
  }
});

module.exports = router; 