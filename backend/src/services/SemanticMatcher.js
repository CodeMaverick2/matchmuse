const OpenAI = require('openai');
const logger = require('../utils/logger');

/**
 * Semantic Matching Service
 * 
 * This service handles AI-powered semantic matching using OpenAI embeddings.
 * It provides fallback mechanisms when AI services are unavailable.
 */
class SemanticMatcher {
  constructor() {
    this.openai = null;
    this.isAvailable = false;
    
    // Initialize OpenAI if API key is available
    if (process.env.OPENAI_API_KEY) {
      try {
        this.openai = new OpenAI({
          apiKey: process.env.OPENAI_API_KEY,
        });
        this.isAvailable = true;
        logger.info('OpenAI semantic matching enabled');
      } catch (error) {
        logger.warn('OpenAI initialization failed:', error);
      }
    } else {
      logger.warn('OpenAI API key not provided, using fallback matching');
    }
  }

  /**
   * Calculate similarity between two sets of style tags
   */
  async calculateStyleSimilarity(tags1, tags2) {
    if (!this.isAvailable || !this.openai) {
      return this.calculateStyleSimilarityFallback(tags1, tags2);
    }

    try {
      const text1 = tags1.join(', ');
      const text2 = tags2.join(', ');
      
      const similarity = await this.calculateTextSimilarity(text1, text2);
      return Math.round(similarity * 20); // Scale to 0-20
    } catch (error) {
      logger.warn('Style similarity calculation failed, using fallback:', error);
      return this.calculateStyleSimilarityFallback(tags1, tags2);
    }
  }

  /**
   * Calculate semantic similarity between two text strings
   */
  async calculateTextSimilarity(text1, text2) {
    if (!this.isAvailable || !this.openai) {
      return this.calculateTextSimilarityFallback(text1, text2);
    }

    try {
      // Generate embeddings for both texts
      const embedding1 = await this.generateEmbedding(text1);
      const embedding2 = await this.generateEmbedding(text2);
      
      // Calculate cosine similarity
      const similarity = this.cosineSimilarity(embedding1, embedding2);
      
      // Scale to 0-20 range
      return Math.round(similarity * 20);
    } catch (error) {
      logger.warn('Text similarity calculation failed, using fallback:', error);
      return this.calculateTextSimilarityFallback(text1, text2);
    }
  }

  /**
   * Generate embedding for a text string using OpenAI
   */
  async generateEmbedding(text) {
    if (!this.openai) {
      throw new Error('OpenAI not available');
    }

    try {
      const response = await this.openai.embeddings.create({
        model: "text-embedding-3-small",
        input: text,
        encoding_format: "float",
      });

      return response.data[0].embedding;
    } catch (error) {
      logger.error('Error generating embedding:', error);
      throw error;
    }
  }

  /**
   * Calculate cosine similarity between two vectors
   */
  cosineSimilarity(vectorA, vectorB) {
    if (!vectorA || !vectorB || vectorA.length !== vectorB.length) {
      return 0;
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < vectorA.length; i++) {
      dotProduct += vectorA[i] * vectorB[i];
      normA += vectorA[i] * vectorA[i];
      normB += vectorB[i] * vectorB[i];
    }

    normA = Math.sqrt(normA);
    normB = Math.sqrt(normB);

    if (normA === 0 || normB === 0) {
      return 0;
    }

    return dotProduct / (normA * normB);
  }

  /**
   * Fallback method for style similarity using keyword matching
   */
  calculateStyleSimilarityFallback(tags1, tags2) {
    if (!tags1 || !tags2 || tags1.length === 0 || tags2.length === 0) {
      return 10; // Neutral score
    }

    const set1 = new Set(tags1.map(tag => tag.toLowerCase()));
    const set2 = new Set(tags2.map(tag => tag.toLowerCase()));
    
    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);
    
    const similarity = intersection.size / union.size;
    return Math.round(similarity * 20);
  }

  /**
   * Fallback method for text similarity using basic string matching
   */
  calculateTextSimilarityFallback(text1, text2) {
    if (!text1 || !text2) {
      return 10; // Neutral score
    }

    const words1 = new Set(text1.toLowerCase().split(/\s+/));
    const words2 = new Set(text2.toLowerCase().split(/\s+/));
    
    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);
    
    const similarity = intersection.size / union.size;
    return Math.round(similarity * 20);
  }

  /**
   * Check if semantic matching is available
   */
  isSemanticMatchingAvailable() {
    return this.isAvailable;
  }

  /**
   * Get service status
   */
  getStatus() {
    return {
      available: this.isAvailable,
      provider: 'OpenAI',
      model: 'text-embedding-3-small'
    };
  }
}

module.exports = SemanticMatcher; 