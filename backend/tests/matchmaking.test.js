const request = require('supertest');
const app = require('../src/server');
const database = require('../src/database/connection');
const MatchmakingEngine = require('../src/services/MatchmakingEngine');

describe('Matchmaking API Tests', () => {
  let testGigId = 'gig_001';
  let testTalentId = 'tal_001';

  beforeAll(async () => {
    // Ensure database is connected
    await database.connect();
  });

  afterAll(async () => {
    await database.disconnect();
  });

  describe('POST /api/matchmaking/match', () => {
    it('should generate matches for a valid gig', async () => {
      const response = await request(app)
        .post('/api/matchmaking/match')
        .send({
          gig_id: testGigId,
          limit: 5
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.gig).toBeDefined();
      expect(response.body.data.matches).toBeInstanceOf(Array);
      expect(response.body.data.metadata).toBeDefined();
      expect(response.body.data.metadata.totalCandidates).toBeGreaterThan(0);
      expect(response.body.data.metadata.qualifiedMatches).toBeGreaterThan(0);
    });

    it('should return error for invalid gig ID', async () => {
      const response = await request(app)
        .post('/api/matchmaking/match')
        .send({
          gig_id: 'invalid_gig_id',
          limit: 5
        })
        .expect(500);

      expect(response.body.error).toBe('Matchmaking failed');
    });

    it('should validate request parameters', async () => {
      const response = await request(app)
        .post('/api/matchmaking/match')
        .send({
          // Missing gig_id
          limit: 5
        })
        .expect(400);

      expect(response.body.error).toBe('Validation error');
    });

    it('should respect limit parameter', async () => {
      const response = await request(app)
        .post('/api/matchmaking/match')
        .send({
          gig_id: testGigId,
          limit: 3
        })
        .expect(200);

      expect(response.body.data.matches.length).toBeLessThanOrEqual(3);
    });

    it('should apply filters correctly', async () => {
      const response = await request(app)
        .post('/api/matchmaking/match')
        .send({
          gig_id: testGigId,
          limit: 10,
          filters: {
            city: 'Mumbai',
            max_budget: 100000
          }
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      

      
      // All returned talents should be from Mumbai and within budget
      response.body.data.matches.forEach(match => {
        expect(match.talent.city).toBe('Mumbai');
        expect(match.talent.budget_max).toBeLessThanOrEqual(100000);
      });
    });
  });

  describe('GET /api/matchmaking/gig/:gigId/matches', () => {
    it('should return matches for a gig', async () => {
      const response = await request(app)
        .get(`/api/matchmaking/gig/${testGigId}/matches`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.matches).toBeInstanceOf(Array);
      expect(response.body.data.pagination).toBeDefined();
    });

    it('should support pagination', async () => {
      const response = await request(app)
        .get(`/api/matchmaking/gig/${testGigId}/matches?limit=5&offset=0`)
        .expect(200);

      expect(response.body.data.pagination.limit).toBe(5);
      expect(response.body.data.pagination.offset).toBe(0);
      expect(response.body.data.matches.length).toBeLessThanOrEqual(5);
    });

    it('should filter by status', async () => {
      const response = await request(app)
        .get(`/api/matchmaking/gig/${testGigId}/matches?status=pending`)
        .expect(200);

      expect(response.body.success).toBe(true);
      response.body.data.matches.forEach(match => {
        expect(match.status).toBe('pending');
      });
    });
  });

  describe('POST /api/matchmaking/feedback', () => {
    it('should submit feedback successfully', async () => {
      const response = await request(app)
        .post('/api/matchmaking/feedback')
        .send({
          match_id: 1,
          rating: 4,
          feedback: 'Great match!',
          decision: 'selected'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Feedback submitted successfully');
    });

    it('should validate feedback data', async () => {
      const response = await request(app)
        .post('/api/matchmaking/feedback')
        .send({
          match_id: 1,
          rating: 6, // Invalid rating
          feedback: 'Test feedback'
        })
        .expect(400);

      expect(response.body.error).toBe('Validation error');
    });
  });

  describe('GET /api/matchmaking/analytics', () => {
    it('should return analytics data', async () => {
      const response = await request(app)
        .get('/api/matchmaking/analytics')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.statistics).toBeDefined();
      expect(response.body.data.top_categories).toBeInstanceOf(Array);
      expect(response.body.data.top_cities).toBeInstanceOf(Array);
    });

    it('should support different time periods', async () => {
      const response = await request(app)
        .get('/api/matchmaking/analytics?period=7d')
        .expect(200);

      expect(response.body.data.period).toBe('7d');
    });
  });

  describe('GET /api/matchmaking/algorithm/status', () => {
    it('should return algorithm configuration', async () => {
      const response = await request(app)
        .get('/api/matchmaking/algorithm/status')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.algorithm).toBe('Hybrid Rule-Based + Semantic Matching');
      expect(response.body.data.configuration).toBeDefined();
      expect(response.body.data.semantic_matching).toBeDefined();
      expect(response.body.data.scoring_breakdown).toBeDefined();
    });
  });
});

describe('MatchmakingEngine Tests', () => {
  let engine;

  beforeAll(() => {
    engine = new MatchmakingEngine();
  });

  describe('Scoring Methods', () => {
    it('should score location correctly', () => {
      // Exact match
      expect(engine.scoreLocation('Mumbai', 'Mumbai', [])).toBe(15);
      
      // Remote work
      expect(engine.scoreLocation('Remote', 'Mumbai', [])).toBe(15);
      
      // Different cities
      expect(engine.scoreLocation('Delhi', 'Mumbai', [])).toBe(5);
    });

    it('should score budget correctly', () => {
      // Perfect match
      expect(engine.scoreBudget(50000, 40000, 60000)).toBe(15);
      
      // Within 10%
      expect(engine.scoreBudget(55000, 40000, 50000)).toBe(12);
      
      // Outside range
      expect(engine.scoreBudget(100000, 40000, 50000)).toBe(3);
    });

    it('should score skills correctly', () => {
      // Category match
      expect(engine.scoreSkills('Photography', ['Photography'], [])).toBe(10);
      
      // No match
      expect(engine.scoreSkills('Photography', ['Direction'], [])).toBe(0);
    });

    it('should score experience correctly', () => {
      // Perfect match for pro level
      expect(engine.scoreExperience('pro', 6)).toBe(10);
      
      // Over-qualified
      expect(engine.scoreExperience('intermediate', 8)).toBe(8);
      
      // Under-qualified
      expect(engine.scoreExperience('pro', 2)).toBe(5);
    });
  });

  describe('Helper Methods', () => {
    it('should identify same region correctly', () => {
      expect(engine.isSameRegion('Mumbai', 'Pune')).toBe(true);
      expect(engine.isSameRegion('Delhi', 'Mumbai')).toBe(false);
    });

    it('should get relevant skills for categories', () => {
      const photographySkills = engine.getRelevantSkills('Photography');
      expect(photographySkills).toContain('photography');
      expect(photographySkills).toContain('camera');
    });
  });
}); 