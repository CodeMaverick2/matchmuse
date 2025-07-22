const express = require('express');
const database = require('../database/connection');
const logger = require('../utils/logger');

const router = express.Router();

/**
 * GET /api/clients
 * List clients with filtering and pagination
 */
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 20, type, industry, city } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let paramIndex = 1;
    let query = 'SELECT * FROM clients WHERE 1=1';
    const params = [];

    if (type) {
      query += ` AND type = $${paramIndex++}`;
      params.push(type);
    }

    if (industry) {
      query += ` AND industry = $${paramIndex++}`;
      params.push(industry);
    }

    if (city) {
      query += ` AND city = $${paramIndex++}`;
      params.push(city);
    }

    // Get total count
    const countQuery = query.replace('SELECT *', 'SELECT COUNT(*) as total');
    const countResult = await database.get(countQuery, params);

    // Add pagination
    query += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(parseInt(limit), offset);

    const clients = await database.all(query, params);

    // Parse JSON fields
    const enrichedClients = clients.map(client => ({
      ...client,
      operating_cities: database.parseJsonField(client.operating_cities),
      communication: database.parseJsonField(client.communication),
      personality: database.parseJsonField(client.personality),
      brand_style: database.parseJsonField(client.brand_style),
      project_behavior: database.parseJsonField(client.project_behavior),
      budgeting: database.parseJsonField(client.budgeting),
      talent_preferences: database.parseJsonField(client.talent_preferences),
      project_history: database.parseJsonField(client.project_history),
      important_dates: database.parseJsonField(client.important_dates),
      social_profiles: database.parseJsonField(client.social_profiles)
    }));

    res.json({
      success: true,
      data: enrichedClients,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: countResult.total,
        totalPages: Math.ceil(countResult.total / parseInt(limit))
      }
    });

  } catch (error) {
    logger.error('Error fetching clients:', error);
    res.status(500).json({
      error: 'Failed to fetch clients',
      message: error.message
    });
  }
});

/**
 * GET /api/clients/:id
 * Get a specific client by ID
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const client = await database.get('SELECT * FROM clients WHERE id = ?', [id]);

    if (!client) {
      return res.status(404).json({
        error: 'Client not found',
        message: `Client with ID ${id} does not exist`
      });
    }

    // Get style preferences
    const stylePreferences = await database.all(
      'SELECT style_preference FROM client_style_preferences WHERE client_id = $1',
      [id]
    );

    const enrichedClient = {
      ...client,
      style_preferences: stylePreferences.map(sp => sp.style_preference),
      operating_cities: database.parseJsonField(client.operating_cities),
      communication: database.parseJsonField(client.communication),
      personality: database.parseJsonField(client.personality),
      brand_style: database.parseJsonField(client.brand_style),
      project_behavior: database.parseJsonField(client.project_behavior),
      budgeting: database.parseJsonField(client.budgeting),
      talent_preferences: database.parseJsonField(client.talent_preferences),
      project_history: database.parseJsonField(client.project_history),
      important_dates: database.parseJsonField(client.important_dates),
      social_profiles: database.parseJsonField(client.social_profiles)
    };

    res.json({
      success: true,
      data: enrichedClient
    });

  } catch (error) {
    logger.error('Error fetching client:', error);
    res.status(500).json({
      error: 'Failed to fetch client',
      message: error.message
    });
  }
});

module.exports = router; 