const { GaleShapleyMatcher } = require('./GaleShapleyMatcher');
const { SemanticMatcher } = require('./SemanticMatcher');
const { MatchmakingEngine } = require('./MatchmakingEngine');
const db = require('../database/connection');
const logger = require('../utils/logger');

class EnhancedMatchmakingEngine {
  constructor() {
    this.galeShapleyMatcher = new GaleShapleyMatcher();
    this.semanticMatcher = new SemanticMatcher();
    this.legacyEngine = new MatchmakingEngine();
    
    // Configuration
    this.useGaleShapley = process.env.USE_GALE_SHAPLEY === 'true';
    this.maxCandidates = parseInt(process.env.MAX_CANDIDATES) || 50;
    this.minScore = parseInt(process.env.MIN_SCORE) || 30;
    this.debugMode = process.env.DEBUG_MODE === 'true';
    
    // Weights for hybrid scoring
    this.ruleBasedWeight = parseFloat(process.env.RULE_BASED_WEIGHT) || 0.6;
    this.semanticWeight = parseFloat(process.env.SEMANTIC_WEIGHT) || 0.4;
  }

  async findMatches(gigOrId, options = {}) {
    const startTime = Date.now();
    
    try {
      let gig, candidates;
      
      if (typeof gigOrId === 'string') {
        // Existing gig-based matching
        const [gigs] = await db.execute('SELECT * FROM gigs WHERE id = ?', [gigOrId]);
        if (gigs.length === 0) {
          throw new Error('Gig not found');
        }
        gig = gigs[0];
        
        // Get candidates for existing gig
        candidates = await this.getCandidatesForGig(gig, options);
      } else {
        // Preference-based matching with virtual gig
        gig = gigOrId;
        candidates = options.candidates || [];
      }

      const { limit = 10, algorithm = 'auto' } = options;
      
      logger.info('Enhanced matchmaking started', {
        gigId: gig.id,
        algorithm,
        candidateCount: candidates.length,
        limit
      });

      let matches, metadata;

      // Determine which algorithm to use
      const selectedAlgorithm = this.selectAlgorithm(algorithm, candidates.length);
      
      if (selectedAlgorithm === 'gale-shapley' && this.useGaleShapley) {
        // Use Gale-Shapley algorithm
        const result = await this.galeShapleyMatcher.findStableMatches(
          [gig], 
          candidates, 
          { 
            limit,
            maxCandidates: this.maxCandidates,
            debugMode: this.debugMode
          }
        );
        
        matches = result.matches;
        metadata = {
          ...result.metadata,
          algorithm: 'gale-shapley',
          stability: 'guaranteed'
        };
        
      } else {
        // Use enhanced legacy algorithm with AI scoring
        matches = await this.findEnhancedMatches(gig, candidates, limit, options);
        metadata = {
          totalProposers: 1,
          totalReviewers: candidates.length,
          matchedProposers: 1,
          matchedReviewers: Math.min(matches.length, candidates.length),
          processingTimeMs: Date.now() - startTime,
          algorithm: 'enhanced',
          stability: 'not-guaranteed',
          totalCandidates: candidates.length
        };
      }

      // Add enhanced scoring breakdown
      matches = await this.addEnhancedScoring(matches, gig, options);

      const processingTime = Date.now() - startTime;
      
      logger.info('Enhanced matchmaking completed', {
        gigId: gig.id,
        algorithm: metadata.algorithm,
        matchCount: matches.length,
        processingTime,
        avgScore: matches.length > 0 ? matches.reduce((sum, m) => sum + m.score, 0) / matches.length : 0
      });

      return {
        matches,
        metadata: {
          ...metadata,
          processingTimeMs: processingTime
        }
      };

    } catch (error) {
      logger.error('Enhanced matchmaking error:', error);
      
      // Fallback to legacy algorithm
      logger.info('Falling back to legacy algorithm');
      return await this.legacyEngine.findMatches(gigOrId, options);
    }
  }

  async getCandidatesForGig(gig, options = {}) {
    const { filters = {} } = options;
    
    let query = `
      SELECT * FROM talents 
      WHERE categories LIKE ? 
      AND availability = 1
    `;
    
    const params = [`%${gig.category}%`];
    
    if (filters.city) {
      query += ' AND city LIKE ?';
      params.push(`%${filters.city}%`);
    }
    
    if (filters.max_budget) {
      query += ' AND budget_min <= ?';
      params.push(filters.max_budget);
    }
    
    if (filters.min_experience) {
      query += ' AND experience_years >= ?';
      params.push(filters.min_experience);
    }
    
    if (filters.categories && filters.categories.length > 0) {
      const categoryConditions = filters.categories.map(() => 'categories LIKE ?').join(' OR ');
      query += ` AND (${categoryConditions})`;
      filters.categories.forEach(cat => params.push(`%${cat}%`));
    }
    
    query += ` ORDER BY rating DESC, experience_years DESC LIMIT ${this.maxCandidates}`;
    
    const [candidates] = await db.execute(query, params);
    return candidates;
  }

  selectAlgorithm(requestedAlgorithm, candidateCount) {
    if (requestedAlgorithm === 'gale-shapley') {
      return 'gale-shapley';
    } else if (requestedAlgorithm === 'legacy') {
      return 'legacy';
    } else {
      // Auto selection
      if (this.useGaleShapley && candidateCount <= this.maxCandidates) {
        return 'gale-shapley';
      } else {
        return 'enhanced';
      }
    }
  }

  async findEnhancedMatches(gig, candidates, limit, options = {}) {
    const matches = [];
    
    for (const candidate of candidates.slice(0, this.maxCandidates)) {
      const score = await this.calculateEnhancedMatchScore(gig, candidate, options);
      
      if (score >= this.minScore) {
        matches.push({
          talent: candidate,
          score: Math.round(score),
          rank: matches.length + 1,
          factors: this.calculateFactorBreakdown(gig, candidate),
          reasoning: this.generateReasoning(gig, candidate, score)
        });
      }
    }
    
    // Sort by score and limit results
    return matches
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  async calculateEnhancedMatchScore(gig, talent, options = {}) {
    try {
      // Calculate rule-based score (60% weight)
      const ruleBasedScore = this.calculateRuleBasedScore(gig, talent);
      
      // Calculate AI semantic score (40% weight)
      const semanticScore = await this.calculateSemanticScore(gig, talent, options);
      
      // Combine scores
      const totalScore = (ruleBasedScore * this.ruleBasedWeight) + (semanticScore * this.semanticWeight);
      
      return Math.min(100, Math.max(0, totalScore));
      
    } catch (error) {
      logger.error('Error calculating enhanced match score:', error);
      // Fallback to rule-based scoring only
      return this.calculateRuleBasedScore(gig, talent);
    }
  }

  calculateRuleBasedScore(gig, talent) {
    let score = 0;
    const factors = {};
    
    // Location compatibility (20 points)
    const locationMatch = this.calculateLocationCompatibility(gig.location, talent.city);
    factors.location = locationMatch * 20;
    score += factors.location;
    
    // Budget alignment (20 points)
    const budgetMatch = this.calculateBudgetAlignment(gig.budget, talent.budget_min, talent.budget_max);
    factors.budget = budgetMatch * 20;
    score += factors.budget;
    
    // Skills match (15 points)
    const skillsMatch = this.calculateSkillsMatch(gig.requirements || [], talent.skills || []);
    factors.skills = skillsMatch * 15;
    score += factors.skills;
    
    // Experience level (15 points)
    const experienceMatch = this.calculateExperienceMatch(gig.expectation_level, talent.experience_years);
    factors.experience = experienceMatch * 15;
    score += factors.experience;
    
    // Availability (10 points)
    const availabilityMatch = talent.availability ? 1 : 0;
    factors.availability = availabilityMatch * 10;
    score += factors.availability;
    
    // Style similarity (10 points)
    const styleMatch = this.calculateStyleSimilarity(gig.style_tags || [], talent.style_tags || []);
    factors.styleSimilarity = styleMatch * 10;
    score += factors.styleSimilarity;
    
    // Rating (10 points)
    const ratingMatch = (talent.rating || 4.0) / 5.0;
    factors.rating = ratingMatch * 10;
    score += factors.rating;
    
    return Math.min(100, score);
  }

  async calculateSemanticScore(gig, talent, options = {}) {
    try {
      const semanticMatcher = new SemanticMatcher();
      
      // Check if AI is available
      const aiStatus = await semanticMatcher.checkStatus();
      if (!aiStatus.available) {
        return 0; // No AI scoring if service unavailable
      }
      
      let totalScore = 0;
      const breakdown = {};
      
      // Style similarity using AI embeddings
      if (gig.style_tags && gig.style_tags.length > 0 && talent.style_tags && talent.style_tags.length > 0) {
        const styleSimilarity = await semanticMatcher.calculateStyleSimilarity(
          gig.style_tags.join(', '),
          talent.style_tags.join(', ')
        );
        breakdown.styleSimilarity = styleSimilarity * 20; // 20 points
        totalScore += breakdown.styleSimilarity;
      }
      
      // Text similarity between project description and talent bio
      if (gig.description && talent.bio) {
        const textSimilarity = await semanticMatcher.calculateTextSimilarity(
          gig.description,
          talent.bio
        );
        breakdown.semanticMatch = textSimilarity * 20; // 20 points
        totalScore += breakdown.semanticMatch;
      }
      
      return Math.min(40, totalScore); // Max 40 points for semantic scoring
      
    } catch (error) {
      logger.error('Error calculating semantic score:', error);
      return 0; // Fallback to 0 if AI scoring fails
    }
  }

  calculateLocationCompatibility(gigLocation, talentLocation) {
    if (!gigLocation || !talentLocation) return 0.5;
    
    const gigCity = gigLocation.toLowerCase().trim();
    const talentCity = talentLocation.toLowerCase().trim();
    
    if (gigCity === talentCity) return 1.0;
    if (gigCity.includes(talentCity) || talentCity.includes(gigCity)) return 0.8;
    
    // Check for common city patterns
    const commonCities = ['mumbai', 'delhi', 'bangalore', 'chennai', 'kolkata', 'hyderabad'];
    if (commonCities.includes(gigCity) && commonCities.includes(talentCity)) return 0.6;
    
    return 0.3; // Default for different cities
  }

  calculateBudgetAlignment(gigBudget, talentMin, talentMax) {
    if (!gigBudget || !talentMin || !talentMax) return 0.5;
    
    const avgTalentRate = (talentMin + talentMax) / 2;
    const dailyRate = avgTalentRate * 8; // Convert hourly to daily
    
    if (gigBudget >= talentMin && gigBudget <= talentMax) return 1.0;
    if (gigBudget >= talentMin * 0.8 && gigBudget <= talentMax * 1.2) return 0.8;
    if (gigBudget >= talentMin * 0.6 && gigBudget <= talentMax * 1.4) return 0.6;
    
    return 0.3; // Budget mismatch
  }

  calculateSkillsMatch(requiredSkills, talentSkills) {
    if (!requiredSkills || !talentSkills) return 0.5;
    
    const required = Array.isArray(requiredSkills) ? requiredSkills : [requiredSkills];
    const talent = Array.isArray(talentSkills) ? talentSkills : talentSkills.split(',').map(s => s.trim());
    
    if (required.length === 0) return 0.5;
    
    const matches = required.filter(req => 
      talent.some(tal => 
        tal.toLowerCase().includes(req.toLowerCase()) || 
        req.toLowerCase().includes(tal.toLowerCase())
      )
    );
    
    return matches.length / required.length;
  }

  calculateExperienceMatch(expectedLevel, experienceYears) {
    if (!expectedLevel || !experienceYears) return 0.5;
    
    const years = parseInt(experienceYears) || 0;
    
    switch (expectedLevel.toLowerCase()) {
      case 'beginner':
        return years <= 2 ? 1.0 : years <= 4 ? 0.7 : 0.4;
      case 'intermediate':
        return years >= 2 && years <= 5 ? 1.0 : years >= 1 && years <= 7 ? 0.8 : 0.5;
      case 'expert':
        return years >= 5 ? 1.0 : years >= 3 ? 0.8 : 0.4;
      default:
        return 0.5;
    }
  }

  calculateStyleSimilarity(gigStyles, talentStyles) {
    if (!gigStyles || !talentStyles) return 0.5;
    
    const gig = Array.isArray(gigStyles) ? gigStyles : [gigStyles];
    const talent = Array.isArray(talentStyles) ? talentStyles : [talentStyles];
    
    if (gig.length === 0 || talent.length === 0) return 0.5;
    
    const matches = gig.filter(g => 
      talent.some(t => 
        t.toLowerCase().includes(g.toLowerCase()) || 
        g.toLowerCase().includes(t.toLowerCase())
      )
    );
    
    return matches.length / Math.max(gig.length, talent.length);
  }

  calculateFactorBreakdown(gig, talent) {
    return {
      locationCompatibility: this.calculateLocationCompatibility(gig.location, talent.city) * 100,
      budgetAlignment: this.calculateBudgetAlignment(gig.budget, talent.budget_min, talent.budget_max) * 100,
      skillsMatch: this.calculateSkillsMatch(gig.requirements || [], talent.skills || []) * 100,
      experienceLevel: this.calculateExperienceMatch(gig.expectation_level, talent.experience_years) * 100,
      styleSimilarity: this.calculateStyleSimilarity(gig.style_tags || [], talent.style_tags || []) * 100
    };
  }

  generateReasoning(gig, talent, score) {
    const reasons = [];
    
    if (this.calculateLocationCompatibility(gig.location, talent.city) > 0.7) {
      reasons.push('Location compatibility');
    }
    if (this.calculateBudgetAlignment(gig.budget, talent.budget_min, talent.budget_max) > 0.7) {
      reasons.push('Budget alignment');
    }
    if (this.calculateSkillsMatch(gig.requirements || [], talent.skills || []) > 0.7) {
      reasons.push('Skills match');
    }
    if (this.calculateExperienceMatch(gig.expectation_level, talent.experience_years) > 0.7) {
      reasons.push('Experience level');
    }
    if (talent.availability) {
      reasons.push('Availability');
    }
    if (this.calculateStyleSimilarity(gig.style_tags || [], talent.style_tags || []) > 0.7) {
      reasons.push('Style similarity');
    }
    
    return reasons.length > 0 
      ? `Strong match in: ${reasons.join(', ')}`
      : 'General compatibility based on project requirements';
  }

  async addEnhancedScoring(matches, gig, options = {}) {
    for (const match of matches) {
      try {
        const ruleBasedScore = this.calculateRuleBasedScore(gig, match.talent);
        const semanticScore = await this.calculateSemanticScore(gig, match.talent, options);
        
        match.totalScore = {
          totalScore: match.score,
          ruleBasedScore: {
            total: Math.round(ruleBasedScore),
            breakdown: this.calculateFactorBreakdown(gig, match.talent)
          },
          semanticScore: {
            total: Math.round(semanticScore),
            breakdown: {
              styleSimilarity: 0, // Will be calculated in semantic scoring
              semanticMatch: 0    // Will be calculated in semantic scoring
            }
          },
          breakdown: this.calculateFactorBreakdown(gig, match.talent)
        };
        
        // Add algorithm info
        match.algorithm = 'enhanced';
        match.match_type = 'ranked';
        match.stability_verified = false;
        
      } catch (error) {
        logger.error('Error adding enhanced scoring:', error);
        // Keep original match data if enhanced scoring fails
      }
    }
    
    return matches;
  }

  getAlgorithmInfo() {
    return {
      name: 'Enhanced Matchmaking Engine',
      version: '2.0.0',
      algorithms: {
        primary: 'Gale-Shapley with AI Enhancement',
        fallback: 'Legacy Hybrid Algorithm'
      },
      features: [
        'AI-powered semantic matching',
        'Stable matching guarantees',
        'Hybrid scoring system',
        'Fallback mechanisms'
      ],
      configuration: {
        useGaleShapley: this.useGaleShapley,
        maxCandidates: this.maxCandidates,
        minScore: this.minScore,
        debugMode: this.debugMode
      }
    };
  }
}

module.exports = { EnhancedMatchmakingEngine }; 