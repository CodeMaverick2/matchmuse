export interface Talent {
  id: string;
  name: string;
  email: string;
  phone: string;
  category: string;
  experience: string; // Changed from experience_years to match component
  location: string;
  hourlyRate: number; // Changed from budget_min/max to match component
  skills: string[]; // Changed from string to array to match component
  portfolio: string[]; // Changed from portfolio_url to array to match component
  bio: string;
  availability: boolean;
  rating: number;
  style_tags: string[];
  created_at: string;
  updated_at: string;
}

export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  industry: string;
  location: string;
  preferences: string[]; // Changed from string to array to match component
  project_history: number;
  created_at: string;
  updated_at: string;
}

export interface Gig {
  id: string;
  title: string;
  description: string;
  category: string;
  budget: number;
  location: string;
  timeline: string;
  requirements: string[]; // Changed from string to array to match component
  client_id: string;
  client?: Client;
  status: 'open' | 'in-progress' | 'completed' | 'cancelled';
  expectation_level: string;
  style_tags: string[];
  created_at: string;
  updated_at: string;
}

// Enhanced scoring breakdown for AI-powered matching
export interface ScoringBreakdown {
  location: number;
  budget: number;
  skills: number;
  experience: number;
  availability: number;
  styleSimilarity: number;
  semanticMatch: number;
}

// Enhanced match with AI scoring details
export interface Match {
  talent: Talent;
  score: number;
  rank: number;
  factors: {
    locationCompatibility: number;
    budgetAlignment: number;
    skillsMatch: number;
    experienceLevel: number;
    styleSimilarity: number;
  };
  reasoning: string;
  match_id?: string;
  gig_id?: string;
  status?: string;
  created_at?: string;
  
  // New enhanced fields
  totalScore?: {
    totalScore: number;
    ruleBasedScore: {
      total: number;
      breakdown: ScoringBreakdown;
    };
    semanticScore: {
      total: number;
      breakdown: {
        styleSimilarity: number;
        semanticMatch: number;
      };
    };
    breakdown: ScoringBreakdown;
  };
  algorithm?: 'gale-shapley' | 'legacy' | 'enhanced';
  match_type?: 'stable' | 'ranked';
  stability_verified?: boolean;
}

// Project preferences for preference-based matching
export interface ProjectPreferences {
  profession: string;
  category: string;
  budget_range: {
    min: number;
    max: number;
  };
  timeline: string;
  location: string;
  radius: number;
  remote: boolean;
  required_skills: string[];
  experience_level: string;
  style_tags: string[];
  project_description: string;
  availability: string;
  rating: number;
}

export interface MatchRequest {
  gig_id?: string;
  preferences?: ProjectPreferences;
  limit?: number;
  algorithm?: 'gale-shapley' | 'legacy' | 'auto';
  filters?: {
    city?: string;
    max_budget?: number;
    min_experience?: number;
    categories?: string[];
    style_tags?: string[];
  };
}

// Enhanced matchmaking metadata
export interface MatchmakingMetadata {
  totalProposers: number;
  totalReviewers: number;
  matchedProposers: number;
  matchedReviewers: number;
  processingTimeMs: number;
  algorithm: string;
  stability: 'guaranteed' | 'not-guaranteed';
  totalCandidates?: number;
}

// Algorithm information
export interface AlgorithmInfo {
  name: string;
  version: string;
  algorithms: {
    primary: string;
    fallback: string;
    galeShapley: {
      algorithm: string;
      complexity: string;
      stability: string;
      optimality: string;
      truthfulness: string;
      references: string[];
    };
  };
  features: string[];
  configuration: {
    useGaleShapley: boolean;
    maxCandidates: number;
    minScore: number;
    debugMode: boolean;
  };
}

// AI service status
export interface AIStatus {
  semantic_matching: {
    available: boolean;
    provider: string;
    model: string;
  };
  features: {
    style_similarity: string;
    text_similarity: string;
    fallback_support: string;
  };
}

// AI similarity response
export interface AISimilarityResponse {
  text1: string;
  text2: string;
  similarity_score: number;
  similarity_percentage: number;
}

// AI embedding response
export interface AIEmbeddingResponse {
  text: string;
  embedding_length: number;
  embedding_preview: number[];
}

export interface Analytics {
  totalTalents: number;
  totalClients: number;
  totalGigs: number;
  matchSuccessRate: number;
  avgProcessingTime: number;
  categoryDistribution: Record<string, number>;
  budgetRanges: Record<string, number>;
  locationInsights: Record<string, number>;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}