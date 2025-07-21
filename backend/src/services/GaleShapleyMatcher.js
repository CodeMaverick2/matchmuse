const logger = require('../utils/logger');

/**
 * Gale-Shapley Algorithm Implementation
 * 
 * This is the Nobel Prize-winning algorithm for stable matching.
 * Used by major platforms like medical residency matching, college admissions,
 * and content delivery networks.
 * 
 * Key Features:
 * - Guarantees stable matching (no blocking pairs)
 * - Optimal for proposers (clients get best possible matches)
 * - Truthful mechanism for proposers
 * - O(n²) time complexity
 * 
 * References:
 * - https://en.wikipedia.org/wiki/Gale%E2%80%93Shapley_algorithm
 * - https://en.wikipedia.org/wiki/Stable_matching_problem
 */
class GaleShapleyMatcher {
  constructor() {
    this.maxIterations = 1000; // Prevent infinite loops
    this.debugMode = process.env.NODE_ENV === 'development';
  }

  /**
   * Main entry point for stable matching
   * @param {Array} proposers - Clients/Gigs (proposing side)
   * @param {Array} reviewers - Talents (reviewing side)
   * @param {Object} options - Configuration options
   * @returns {Object} Stable matching results
   */
  async findStableMatches(proposers, reviewers, options = {}) {
    const startTime = Date.now();
    logger.info(`Starting Gale-Shapley matching with ${proposers.length} proposers and ${reviewers.length} reviewers`);

    try {
      // 1. Generate preference lists using AI scoring
      const proposerPreferences = await this.generateProposerPreferences(proposers, reviewers, options);
      const reviewerPreferences = await this.generateReviewerPreferences(reviewers, proposers, options);

      // 2. Run Gale-Shapley algorithm
      const stableMatches = this.galeShapleyAlgorithm(proposerPreferences, reviewerPreferences);

      // 3. Enrich results with match details
      const enrichedMatches = await this.enrichMatches(stableMatches, proposers, reviewers);

      const processingTime = Date.now() - startTime;
      logger.info(`Gale-Shapley matching completed in ${processingTime}ms. Found ${enrichedMatches.length} stable matches`);

      return {
        matches: enrichedMatches,
        metadata: {
          totalProposers: proposers.length,
          totalReviewers: reviewers.length,
          matchedProposers: enrichedMatches.length,
          matchedReviewers: enrichedMatches.length,
          processingTimeMs: processingTime,
          algorithm: 'gale-shapley',
          stability: 'guaranteed'
        }
      };

    } catch (error) {
      logger.error('Gale-Shapley matching failed:', error);
      throw error;
    }
  }

  /**
   * Generate preference lists for proposers (clients/gigs)
   * Uses AI scoring to rank reviewers (talents)
   */
  async generateProposerPreferences(proposers, reviewers, options) {
    const preferences = {};
    const { scoringEngine } = options;

    logger.info('Generating proposer preferences...');

    for (const proposer of proposers) {
      const scoredReviewers = [];

      // Score each reviewer for this proposer
      for (const reviewer of reviewers) {
        try {
          const score = scoringEngine ? 
            await scoringEngine.calculateMatchScore(proposer, reviewer) :
            await this.calculateBasicScore(proposer, reviewer);

          scoredReviewers.push({
            id: reviewer.id,
            score: score.totalScore || score,
            breakdown: score.breakdown || {}
          });
        } catch (error) {
          logger.warn(`Error scoring reviewer ${reviewer.id} for proposer ${proposer.id}:`, error);
          // Add with neutral score
          scoredReviewers.push({
            id: reviewer.id,
            score: 50,
            breakdown: {}
          });
        }
      }

      // Sort by score (descending) to create preference list
      scoredReviewers.sort((a, b) => b.score - a.score);
      preferences[proposer.id] = scoredReviewers.map(item => item.id);

      if (this.debugMode) {
        logger.debug(`Proposer ${proposer.id} preferences:`, preferences[proposer.id].slice(0, 5));
      }
    }

    return preferences;
  }

  /**
   * Generate preference lists for reviewers (talents)
   * Uses AI scoring to rank proposers (clients/gigs)
   */
  async generateReviewerPreferences(reviewers, proposers, options) {
    const preferences = {};
    const { scoringEngine } = options;

    logger.info('Generating reviewer preferences...');

    for (const reviewer of reviewers) {
      const scoredProposers = [];

      // Score each proposer for this reviewer
      for (const proposer of proposers) {
        try {
          const score = scoringEngine ? 
            await scoringEngine.calculateMatchScore(proposer, reviewer) :
            await this.calculateBasicScore(proposer, reviewer);

          scoredProposers.push({
            id: proposer.id,
            score: score.totalScore || score,
            breakdown: score.breakdown || {}
          });
        } catch (error) {
          logger.warn(`Error scoring proposer ${proposer.id} for reviewer ${reviewer.id}:`, error);
          // Add with neutral score
          scoredProposers.push({
            id: proposer.id,
            score: 50,
            breakdown: {}
          });
        }
      }

      // Sort by score (descending) to create preference list
      scoredProposers.sort((a, b) => b.score - a.score);
      preferences[reviewer.id] = scoredProposers.map(item => item.id);

      if (this.debugMode) {
        logger.debug(`Reviewer ${reviewer.id} preferences:`, preferences[reviewer.id].slice(0, 5));
      }
    }

    return preferences;
  }

  /**
   * Core Gale-Shapley algorithm implementation
   * @param {Object} proposerPreferences - Proposer preference lists
   * @param {Object} reviewerPreferences - Reviewer preference lists
   * @returns {Object} Stable matching results
   */
  galeShapleyAlgorithm(proposerPreferences, reviewerPreferences) {
    logger.info('Running Gale-Shapley algorithm...');

    const matches = {}; // proposer_id -> reviewer_id
    const reverseMatches = {}; // reviewer_id -> proposer_id
    const unmatchedProposers = Object.keys(proposerPreferences);
    const proposerProposalIndex = {}; // Track next proposal for each proposer

    // Initialize proposal indices
    for (const proposerId of unmatchedProposers) {
      proposerProposalIndex[proposerId] = 0;
    }

    let iterations = 0;

    // Main algorithm loop
    while (unmatchedProposers.length > 0 && iterations < this.maxIterations) {
      iterations++;
      const proposerId = unmatchedProposers[0];
      const proposerPrefs = proposerPreferences[proposerId];
      const proposalIndex = proposerProposalIndex[proposerId];

      // Check if proposer has exhausted all preferences
      if (proposalIndex >= proposerPrefs.length) {
        logger.warn(`Proposer ${proposerId} has exhausted all preferences`);
        unmatchedProposers.shift(); // Remove from unmatched
        continue;
      }

      // Get next preferred reviewer
      const reviewerId = proposerPrefs[proposalIndex];
      proposerProposalIndex[proposerId]++;

      if (this.debugMode) {
        logger.debug(`Iteration ${iterations}: Proposer ${proposerId} proposes to Reviewer ${reviewerId}`);
      }

      // Check if reviewer is unmatched
      if (!reverseMatches[reviewerId]) {
        // Reviewer is unmatched, accept proposal
        matches[proposerId] = reviewerId;
        reverseMatches[reviewerId] = proposerId;
        unmatchedProposers.shift();

        if (this.debugMode) {
          logger.debug(`Match created: ${proposerId} -> ${reviewerId}`);
        }
      } else {
        // Reviewer is already matched, check preference
        const currentProposerId = reverseMatches[reviewerId];
        const reviewerPrefs = reviewerPreferences[reviewerId];

        const currentRank = reviewerPrefs.indexOf(currentProposerId);
        const newRank = reviewerPrefs.indexOf(proposerId);

        // Lower rank (index) means higher preference
        if (newRank < currentRank) {
          // Reviewer prefers new proposer
          matches[proposerId] = reviewerId;
          reverseMatches[reviewerId] = proposerId;

          // Reject current proposer
          delete matches[currentProposerId];
          unmatchedProposers.push(currentProposerId);

          // Remove current proposer from unmatched list
          unmatchedProposers.shift();

          if (this.debugMode) {
            logger.debug(`Match updated: ${proposerId} -> ${reviewerId} (rejected ${currentProposerId})`);
          }
        } else {
          // Reviewer prefers current proposer, reject new proposal
          if (this.debugMode) {
            logger.debug(`Proposal rejected: ${proposerId} -> ${reviewerId}`);
          }
        }
      }
    }

    if (iterations >= this.maxIterations) {
      logger.warn(`Gale-Shapley algorithm reached maximum iterations (${this.maxIterations})`);
    }

    logger.info(`Gale-Shapley completed in ${iterations} iterations`);
    return { matches, reverseMatches, iterations };
  }

  /**
   * Enrich matches with detailed information
   */
  async enrichMatches(matchingResult, proposers, reviewers) {
    const { matches, reverseMatches } = matchingResult;
    const enrichedMatches = [];

    for (const [proposerId, reviewerId] of Object.entries(matches)) {
      const proposer = proposers.find(p => p.id === proposerId);
      const reviewer = reviewers.find(r => r.id === reviewerId);

      if (proposer && reviewer) {
        enrichedMatches.push({
          proposer_id: proposerId,
          reviewer_id: reviewerId,
          proposer: proposer,
          reviewer: reviewer,
          match_type: 'stable',
          algorithm: 'gale-shapley',
          created_at: new Date().toISOString()
        });
      }
    }

    return enrichedMatches;
  }

  /**
   * Basic scoring fallback when no scoring engine is provided
   */
  async calculateBasicScore(proposer, reviewer) {
    // Simple scoring based on basic criteria
    let score = 0;
    const breakdown = {};

    // Location match (0-25 points)
    if (proposer.city === reviewer.city) {
      breakdown.location = 25;
      score += 25;
    } else if (proposer.city === 'Remote' || reviewer.city === 'Remote') {
      breakdown.location = 20;
      score += 20;
    } else {
      breakdown.location = 10;
      score += 10;
    }

    // Budget compatibility (0-25 points)
    if (proposer.budget && reviewer.budget_min && reviewer.budget_max) {
      if (proposer.budget >= reviewer.budget_min && proposer.budget <= reviewer.budget_max) {
        breakdown.budget = 25;
        score += 25;
      } else {
        breakdown.budget = 10;
        score += 10;
      }
    } else {
      breakdown.budget = 15;
      score += 15;
    }

    // Category match (0-25 points)
    if (reviewer.categories && reviewer.categories.includes(proposer.category)) {
      breakdown.category = 25;
      score += 25;
    } else {
      breakdown.category = 10;
      score += 10;
    }

    // Experience level (0-25 points)
    if (proposer.expectation_level && reviewer.experience_years) {
      const experienceMap = {
        'basic': [0, 2],
        'intermediate': [2, 5],
        'pro': [5, 8],
        'top-tier': [8, 15],
        'expert': [15, 999]
      };

      const [minExp, maxExp] = experienceMap[proposer.expectation_level] || [0, 999];
      
      if (reviewer.experience_years >= minExp && reviewer.experience_years <= maxExp) {
        breakdown.experience = 25;
        score += 25;
      } else {
        breakdown.experience = 15;
        score += 15;
      }
    } else {
      breakdown.experience = 20;
      score += 20;
    }

    return {
      totalScore: score,
      breakdown
    };
  }

  /**
   * Verify stability of matching
   * @param {Object} matches - Current matches
   * @param {Object} proposerPreferences - Proposer preferences
   * @param {Object} reviewerPreferences - Reviewer preferences
   * @returns {Object} Stability verification results
   */
  verifyStability(matches, proposerPreferences, reviewerPreferences) {
    const blockingPairs = [];

    for (const [proposerId, matchedReviewerId] of Object.entries(matches)) {
      const proposerPrefs = proposerPreferences[proposerId];
      const matchedReviewerRank = proposerPrefs.indexOf(matchedReviewerId);

      // Check if proposer prefers any other reviewer over current match
      for (let i = 0; i < matchedReviewerRank; i++) {
        const preferredReviewerId = proposerPrefs[i];
        const preferredReviewerPrefs = reviewerPreferences[preferredReviewerId];
        const currentProposerRank = preferredReviewerPrefs.indexOf(proposerId);

        // Check if preferred reviewer is unmatched or prefers this proposer
        if (!matches[preferredReviewerId] || 
            preferredReviewerPrefs.indexOf(matches[preferredReviewerId]) > currentProposerRank) {
          blockingPairs.push({
            proposer_id: proposerId,
            reviewer_id: preferredReviewerId,
            reason: 'mutual_preference'
          });
        }
      }
    }

    return {
      isStable: blockingPairs.length === 0,
      blockingPairs,
      totalBlockingPairs: blockingPairs.length
    };
  }

  /**
   * Get algorithm statistics
   */
  getStatistics() {
    return {
      algorithm: 'Gale-Shapley',
      complexity: 'O(n²)',
      stability: 'Guaranteed',
      optimality: 'Optimal for proposers',
      truthfulness: 'Truthful for proposers',
      references: [
        'https://en.wikipedia.org/wiki/Gale%E2%80%93Shapley_algorithm',
        'https://en.wikipedia.org/wiki/Stable_matching_problem'
      ]
    };
  }
}

module.exports = GaleShapleyMatcher; 