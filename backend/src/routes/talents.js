const express = require('express');
const Joi = require('joi');
const database = require('../database/connection');
const logger = require('../utils/logger');

const router = express.Router();

// Validation schemas
const talentCreateSchema = Joi.object({
  name: Joi.string().required().max(100),
  city: Joi.string().max(50),
  hometown: Joi.string().max(50),
  experience_years: Joi.number().integer().min(0).max(50),
  budget_min: Joi.number().positive(),
  budget_max: Joi.number().positive(),
  categories: Joi.array().items(Joi.string()),
  skills: Joi.array().items(Joi.string()),
  style_tags: Joi.array().items(Joi.string()),
  soft_skills: Joi.object(),
  software_skills: Joi.object(),
  languages: Joi.array().items(Joi.string()),
  past_credits: Joi.array().items(Joi.string()),
  endorsements: Joi.array().items(Joi.string()),
  interest_tags: Joi.array().items(Joi.string()),
  tier_tags: Joi.array().items(Joi.string())
});

/**
 * GET /api/talents
 * List talents with filtering and pagination
 */
router.get('/', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      city,
      category,
      skill,
      min_experience,
      max_budget,
      style_tag
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);

    // Build query with filters
    let query = `
      SELECT DISTINCT t.*
      FROM talents t
      LEFT JOIN talent_categories tc ON t.id = tc.talent_id
      LEFT JOIN talent_skills ts ON t.id = ts.talent_id
      LEFT JOIN talent_style_tags tst ON t.id = tst.talent_id
      WHERE 1=1
    `;
    
    const params = [];

    if (city) {
      query += ' AND t.city = ?';
      params.push(city);
    }

    if (category) {
      query += ' AND tc.category = ?';
      params.push(category);
    }

    if (skill) {
      query += ' AND ts.skill LIKE ?';
      params.push(`%${skill}%`);
    }

    if (min_experience) {
      query += ' AND t.experience_years >= ?';
      params.push(parseInt(min_experience));
    }

    if (max_budget) {
      query += ' AND t.budget_max <= ?';
      params.push(parseInt(max_budget));
    }

    if (style_tag) {
      query += ' AND tst.style_tag = ?';
      params.push(style_tag);
    }

    // Get total count
    const countQuery = query.replace('SELECT DISTINCT t.*', 'SELECT COUNT(DISTINCT t.id) as total');
    const countResult = await database.get(countQuery, params);

    // Add pagination
    query += ' ORDER BY t.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);

    const talents = await database.all(query, params);

    // Enrich talent data
    const enrichedTalents = await Promise.all(
      talents.map(async (talent) => {
        return await enrichTalentData(talent);
      })
    );

    res.json({
      success: true,
      data: enrichedTalents,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: countResult.total,
        totalPages: Math.ceil(countResult.total / parseInt(limit)),
        hasNext: (parseInt(page) * parseInt(limit)) < countResult.total,
        hasPrev: parseInt(page) > 1
      }
    });

  } catch (error) {
    logger.error('Error fetching talents:', error);
    res.status(500).json({
      error: 'Failed to fetch talents',
      message: error.message
    });
  }
});

/**
 * GET /api/talents/:id
 * Get a specific talent by ID
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const talent = await database.get('SELECT * FROM talents WHERE id = ?', [id]);

    if (!talent) {
      return res.status(404).json({
        error: 'Talent not found',
        message: `Talent with ID ${id} does not exist`
      });
    }

    const enrichedTalent = await enrichTalentData(talent);

    res.json({
      success: true,
      data: enrichedTalent
    });

  } catch (error) {
    logger.error('Error fetching talent:', error);
    res.status(500).json({
      error: 'Failed to fetch talent',
      message: error.message
    });
  }
});

/**
 * POST /api/talents
 * Create a new talent
 */
router.post('/', async (req, res) => {
  try {
    // Validate request
    const { error, value } = talentCreateSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Validation error',
        details: error.details.map(d => d.message)
      });
    }

    const talentData = value;
    const talentId = `tal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    await database.transaction(async () => {
      // Insert main talent record
      await database.run(`
        INSERT INTO talents (
          id, name, city, hometown, experience_years, budget_min, budget_max,
          soft_skills, software_skills, languages, past_credits, endorsements,
          interest_tags, tier_tags
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        talentId,
        talentData.name,
        talentData.city,
        talentData.hometown,
        talentData.experience_years,
        talentData.budget_min,
        talentData.budget_max,
        database.stringifyJsonField(talentData.soft_skills),
        database.stringifyJsonField(talentData.software_skills),
        database.stringifyJsonField(talentData.languages),
        database.stringifyJsonField(talentData.past_credits),
        database.stringifyJsonField(talentData.endorsements),
        database.stringifyJsonField(talentData.interest_tags),
        database.stringifyJsonField(talentData.tier_tags)
      ]);

      // Insert categories
      if (talentData.categories) {
        for (const category of talentData.categories) {
          await database.run(
            'INSERT INTO talent_categories (talent_id, category) VALUES (?, ?)',
            [talentId, category]
          );
        }
      }

      // Insert skills
      if (talentData.skills) {
        for (const skill of talentData.skills) {
          await database.run(
            'INSERT INTO talent_skills (talent_id, skill) VALUES (?, ?)',
            [talentId, skill]
          );
        }
      }

      // Insert style tags
      if (talentData.style_tags) {
        for (const styleTag of talentData.style_tags) {
          await database.run(
            'INSERT INTO talent_style_tags (talent_id, style_tag) VALUES (?, ?)',
            [talentId, styleTag]
          );
        }
      }
    });

    // Get the created talent
    const createdTalent = await database.get('SELECT * FROM talents WHERE id = ?', [talentId]);
    const enrichedTalent = await enrichTalentData(createdTalent);

    logger.info(`Created new talent: ${talentId}`);

    res.status(201).json({
      success: true,
      data: enrichedTalent,
      message: 'Talent created successfully'
    });

  } catch (error) {
    logger.error('Error creating talent:', error);
    res.status(500).json({
      error: 'Failed to create talent',
      message: error.message
    });
  }
});

/**
 * PUT /api/talents/:id
 * Update a talent
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Check if talent exists
    const existingTalent = await database.get('SELECT id FROM talents WHERE id = ?', [id]);
    if (!existingTalent) {
      return res.status(404).json({
        error: 'Talent not found',
        message: `Talent with ID ${id} does not exist`
      });
    }

    // Validate request
    const { error, value } = talentCreateSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Validation error',
        details: error.details.map(d => d.message)
      });
    }

    const talentData = value;

    await database.transaction(async () => {
      // Update main talent record
      await database.run(`
        UPDATE talents SET
          name = ?, city = ?, hometown = ?, experience_years = ?,
          budget_min = ?, budget_max = ?, soft_skills = ?, software_skills = ?,
          languages = ?, past_credits = ?, endorsements = ?, interest_tags = ?,
          tier_tags = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [
        talentData.name,
        talentData.city,
        talentData.hometown,
        talentData.experience_years,
        talentData.budget_min,
        talentData.budget_max,
        database.stringifyJsonField(talentData.soft_skills),
        database.stringifyJsonField(talentData.software_skills),
        database.stringifyJsonField(talentData.languages),
        database.stringifyJsonField(talentData.past_credits),
        database.stringifyJsonField(talentData.endorsements),
        database.stringifyJsonField(talentData.interest_tags),
        database.stringifyJsonField(talentData.tier_tags),
        id
      ]);

      // Clear existing relationships
      await database.run('DELETE FROM talent_categories WHERE talent_id = ?', [id]);
      await database.run('DELETE FROM talent_skills WHERE talent_id = ?', [id]);
      await database.run('DELETE FROM talent_style_tags WHERE talent_id = ?', [id]);

      // Insert new relationships
      if (talentData.categories) {
        for (const category of talentData.categories) {
          await database.run(
            'INSERT INTO talent_categories (talent_id, category) VALUES (?, ?)',
            [id, category]
          );
        }
      }

      if (talentData.skills) {
        for (const skill of talentData.skills) {
          await database.run(
            'INSERT INTO talent_skills (talent_id, skill) VALUES (?, ?)',
            [id, skill]
          );
        }
      }

      if (talentData.style_tags) {
        for (const styleTag of talentData.style_tags) {
          await database.run(
            'INSERT INTO talent_style_tags (talent_id, style_tag) VALUES (?, ?)',
            [id, styleTag]
          );
        }
      }
    });

    // Get the updated talent
    const updatedTalent = await database.get('SELECT * FROM talents WHERE id = ?', [id]);
    const enrichedTalent = await enrichTalentData(updatedTalent);

    logger.info(`Updated talent: ${id}`);

    res.json({
      success: true,
      data: enrichedTalent,
      message: 'Talent updated successfully'
    });

  } catch (error) {
    logger.error('Error updating talent:', error);
    res.status(500).json({
      error: 'Failed to update talent',
      message: error.message
    });
  }
});

/**
 * DELETE /api/talents/:id
 * Delete a talent
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Check if talent exists
    const existingTalent = await database.get('SELECT id FROM talents WHERE id = ?', [id]);
    if (!existingTalent) {
      return res.status(404).json({
        error: 'Talent not found',
        message: `Talent with ID ${id} does not exist`
      });
    }

    // Delete talent (cascade will handle related records)
    await database.run('DELETE FROM talents WHERE id = ?', [id]);

    logger.info(`Deleted talent: ${id}`);

    res.json({
      success: true,
      message: 'Talent deleted successfully'
    });

  } catch (error) {
    logger.error('Error deleting talent:', error);
    res.status(500).json({
      error: 'Failed to delete talent',
      message: error.message
    });
  }
});

/**
 * GET /api/talents/stats/summary
 * Get talent statistics
 */
router.get('/stats/summary', async (req, res) => {
  try {
    const stats = await database.get(`
      SELECT 
        COUNT(*) as total_talents,
        AVG(experience_years) as avg_experience,
        COUNT(DISTINCT city) as unique_cities
      FROM talents
    `);

    const topCategories = await database.all(`
      SELECT category, COUNT(*) as count
      FROM talent_categories
      GROUP BY category
      ORDER BY count DESC
      LIMIT 5
    `);

    const topCities = await database.all(`
      SELECT city, COUNT(*) as count
      FROM talents
      WHERE city IS NOT NULL
      GROUP BY city
      ORDER BY count DESC
      LIMIT 5
    `);

    res.json({
      success: true,
      data: {
        summary: {
          total_talents: stats.total_talents,
          average_experience: Math.round(stats.avg_experience * 100) / 100,
          unique_cities: stats.unique_cities
        },
        top_categories: topCategories,
        top_cities: topCities
      }
    });

  } catch (error) {
    logger.error('Error fetching talent stats:', error);
    res.status(500).json({
      error: 'Failed to fetch talent statistics',
      message: error.message
    });
  }
});

// Helper function to enrich talent data
async function enrichTalentData(talent) {
  // Get categories
  const categories = await database.all(
    'SELECT category FROM talent_categories WHERE talent_id = ?',
    [talent.id]
  );
  talent.categories = categories.map(c => c.category);

  // Get skills
  const skills = await database.all(
    'SELECT skill FROM talent_skills WHERE talent_id = ?',
    [talent.id]
  );
  talent.skills = skills.map(s => s.skill);

  // Get style tags
  const styleTags = await database.all(
    'SELECT style_tag FROM talent_style_tags WHERE talent_id = ?',
    [talent.id]
  );
  talent.style_tags = styleTags.map(s => s.style_tag);

  // Get portfolio
  const portfolio = await database.all(
    'SELECT * FROM talent_portfolio WHERE talent_id = ?',
    [talent.id]
  );
  talent.portfolio = portfolio.map(p => ({
    ...p,
    tags: database.parseJsonField(p.tags),
    keywords: database.parseJsonField(p.keywords)
  }));

  // Get availability
  const availability = await database.all(
    'SELECT * FROM talent_availability WHERE talent_id = ?',
    [talent.id]
  );
  talent.availability = availability;

  // Parse JSON fields
  talent.soft_skills = database.parseJsonField(talent.soft_skills);
  talent.software_skills = database.parseJsonField(talent.software_skills);
  talent.languages = database.parseJsonField(talent.languages);
  talent.past_credits = database.parseJsonField(talent.past_credits);
  talent.endorsements = database.parseJsonField(talent.endorsements);
  talent.interest_tags = database.parseJsonField(talent.interest_tags);
  talent.tier_tags = database.parseJsonField(talent.tier_tags);

  return talent;
}

module.exports = router; 