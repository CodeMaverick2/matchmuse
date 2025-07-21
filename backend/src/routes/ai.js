const express = require('express');
const SemanticMatcher = require('../services/SemanticMatcher');
const logger = require('../utils/logger');

const router = express.Router();
const semanticMatcher = new SemanticMatcher();

/**
 * GET /api/ai/status
 * Get AI service status
 */
router.get('/status', (req, res) => {
  res.json({
    success: true,
    data: {
      semantic_matching: semanticMatcher.getStatus(),
      features: {
        style_similarity: 'AI-powered style tag matching',
        text_similarity: 'Semantic text matching using embeddings',
        fallback_support: 'Rule-based fallback when AI unavailable'
      }
    }
  });
});

/**
 * POST /api/ai/generate-embeddings
 * Generate embeddings for text
 */
router.post('/generate-embeddings', async (req, res) => {
  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({
        error: 'Text is required',
        message: 'Please provide text to generate embeddings for'
      });
    }

    const embedding = await semanticMatcher.generateEmbedding(text);

    res.json({
      success: true,
      data: {
        text,
        embedding_length: embedding.length,
        embedding_preview: embedding.slice(0, 5) // First 5 values for preview
      }
    });

  } catch (error) {
    logger.error('Error generating embeddings:', error);
    res.status(500).json({
      error: 'Failed to generate embeddings',
      message: error.message
    });
  }
});

/**
 * POST /api/ai/calculate-similarity
 * Calculate similarity between two texts
 */
router.post('/calculate-similarity', async (req, res) => {
  try {
    const { text1, text2 } = req.body;

    if (!text1 || !text2) {
      return res.status(400).json({
        error: 'Both texts are required',
        message: 'Please provide text1 and text2 to calculate similarity'
      });
    }

    const similarity = await semanticMatcher.calculateTextSimilarity(text1, text2);

    res.json({
      success: true,
      data: {
        text1,
        text2,
        similarity_score: similarity,
        similarity_percentage: Math.round((similarity / 20) * 100) // Convert to percentage
      }
    });

  } catch (error) {
    logger.error('Error calculating similarity:', error);
    res.status(500).json({
      error: 'Failed to calculate similarity',
      message: error.message
    });
  }
});

module.exports = router; 