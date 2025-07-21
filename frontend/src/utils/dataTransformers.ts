import type { Talent, Client, Gig, Match, MatchmakingMetadata } from '../types';

// Backend Talent structure to Frontend Talent
export const transformTalent = (backendTalent: any): Talent => {
  return {
    id: backendTalent.id,
    name: backendTalent.name,
    email: backendTalent.email || `${backendTalent.name.toLowerCase().replace(/\s+/g, '.')}@example.com`,
    phone: backendTalent.phone || '+91-98765-43210',
    category: backendTalent.categories?.[0] || 'Photographer',
    experience: `${backendTalent.experience_years || 2} years`,
    location: backendTalent.city || backendTalent.hometown || 'Mumbai',
    hourlyRate: Math.floor((backendTalent.budget_min || 5000) / 8), // Convert daily rate to hourly
    skills: backendTalent.skills || ['Photography', 'Videography'],
    portfolio: backendTalent.portfolio?.map((p: any) => p.title) || ['Portfolio Link'],
    bio: `Experienced ${backendTalent.categories?.[0] || 'Photographer'} with ${backendTalent.experience_years || 2} years of experience. Specializes in ${backendTalent.skills?.join(', ') || 'Photography'}.`,
    availability: backendTalent.availability?.length > 0 || true,
    rating: 4.5, // Default rating
    style_tags: backendTalent.style_tags || [],
    created_at: backendTalent.created_at,
    updated_at: backendTalent.updated_at
  };
};

// Backend Client structure to Frontend Client
export const transformClient = (backendClient: any): Client => {
  return {
    id: backendClient.id,
    name: backendClient.name,
    email: backendClient.email || `${backendClient.name.toLowerCase().replace(/\s+/g, '.')}@example.com`,
    phone: backendClient.phone || '+91-98765-43210',
    company: backendClient.name,
    industry: backendClient.industry || 'Technology',
    location: backendClient.headquarters_city || backendClient.city || 'Mumbai',
    preferences: backendClient.brand_style || ['Modern', 'Professional'],
    project_history: backendClient.project_history?.length || 0,
    created_at: backendClient.created_at,
    updated_at: backendClient.updated_at
  };
};

// Backend Gig structure to Frontend Gig
export const transformGig = (backendGig: any): Gig => {
  return {
    id: backendGig.id,
    title: backendGig.title,
    description: backendGig.brief_text || backendGig.description || 'Project description',
    category: backendGig.category || 'Photography',
    budget: backendGig.budget || 25000,
    location: backendGig.city || 'Mumbai',
    timeline: backendGig.start_date ? `Starting ${backendGig.start_date}` : 'Flexible',
    requirements: backendGig.style_tags || ['Professional quality'],
    client_id: backendGig.client_id,
    client: backendGig.client_name ? {
      id: backendGig.client_id,
      name: backendGig.client_name,
      email: `${backendGig.client_name.toLowerCase().replace(/\s+/g, '.')}@example.com`,
      phone: '+91-98765-43210',
      company: backendGig.client_name,
      industry: backendGig.client_industry || 'Technology',
      location: backendGig.city || 'Mumbai',
      preferences: 'Professional, High-quality',
      project_history: 5,
      created_at: backendGig.created_at,
      updated_at: backendGig.updated_at
    } : undefined,
    status: mapGigStatus(backendGig.status),
    expectation_level: backendGig.expectation_level || 'intermediate',
    style_tags: backendGig.style_tags || backendGig.style_tags_json || [],
    created_at: backendGig.created_at,
    updated_at: backendGig.updated_at
  };
};

// Map backend gig status to frontend status
const mapGigStatus = (backendStatus: string): 'open' | 'in-progress' | 'completed' | 'cancelled' => {
  switch (backendStatus) {
    case 'ready to matchmake':
    case 'lead':
    case 'shortlist being prepared':
      return 'open';
    case 'in progress':
    case 'delivery in progress':
      return 'in-progress';
    case 'confirmed':
    case 'final discussions':
    case 'shortlist shared':
      return 'completed';
    case 'cancelled':
    case 'lost':
      return 'cancelled';
    default:
      return 'open';
  }
};

// Transform arrays of data
export const transformTalents = (backendTalents: any[]): Talent[] => {
  return backendTalents.map(transformTalent);
};

export const transformClients = (backendClients: any[]): Client[] => {
  return backendClients.map(transformClient);
};

export const transformGigs = (backendGigs: any[]): Gig[] => {
  return backendGigs.map(transformGig);
};

// Transform enhanced matchmaking response
export const transformMatchmakingResponse = (backendResponse: any): { gig: Gig; matches: Match[]; metadata: MatchmakingMetadata } => {
  return {
    gig: transformGig(backendResponse.gig),
    matches: backendResponse.matches.map(transformMatch),
    metadata: transformMatchmakingMetadata(backendResponse.metadata)
  };
};

// Transform matchmaking metadata
export const transformMatchmakingMetadata = (backendMetadata: any): MatchmakingMetadata => {
  return {
    totalProposers: backendMetadata.totalProposers || 0,
    totalReviewers: backendMetadata.totalReviewers || 0,
    matchedProposers: backendMetadata.matchedProposers || 0,
    matchedReviewers: backendMetadata.matchedReviewers || 0,
    processingTimeMs: backendMetadata.processingTimeMs || 0,
    algorithm: backendMetadata.algorithm || 'legacy',
    stability: backendMetadata.stability || 'not-guaranteed',
    totalCandidates: backendMetadata.totalCandidates || 0
  };
};

// Transform individual match with enhanced scoring
export const transformMatch = (backendMatch: any): Match => {
  // Handle both old and new scoring formats
  const hasEnhancedScoring = backendMatch.totalScore && typeof backendMatch.totalScore === 'object';
  
  if (hasEnhancedScoring) {
    // Enhanced scoring format with AI breakdown
    return {
      talent: transformTalent(backendMatch.talent),
      score: Math.round(backendMatch.totalScore.totalScore || 0),
      rank: backendMatch.rank || 1,
      factors: {
        locationCompatibility: backendMatch.totalScore.breakdown?.location || 0,
        budgetAlignment: backendMatch.totalScore.breakdown?.budget || 0,
        skillsMatch: backendMatch.totalScore.breakdown?.skills || 0,
        experienceLevel: backendMatch.totalScore.breakdown?.experience || 0,
        styleSimilarity: backendMatch.totalScore.breakdown?.styleSimilarity || 0
      },
      reasoning: generateEnhancedReasoning(backendMatch.totalScore.breakdown),
      match_id: backendMatch.match_id,
      gig_id: backendMatch.gig_id,
      status: backendMatch.status,
      created_at: backendMatch.created_at,
      
      // Enhanced fields
      totalScore: backendMatch.totalScore,
      algorithm: backendMatch.algorithm || 'enhanced',
      match_type: backendMatch.match_type || 'ranked',
      stability_verified: backendMatch.stability_verified || false
    };
  } else {
    // Legacy scoring format
    return {
      talent: transformTalent(backendMatch.talent),
      score: Math.round(backendMatch.totalScore || 0),
      rank: backendMatch.rank || 0,
      factors: {
        locationCompatibility: backendMatch.breakdown?.location || 0,
        budgetAlignment: backendMatch.breakdown?.budget || 0,
        skillsMatch: backendMatch.breakdown?.skills || 0,
        experienceLevel: backendMatch.breakdown?.experience || 0,
        styleSimilarity: backendMatch.breakdown?.styleSimilarity || 0
      },
      reasoning: generateReasoning(backendMatch.breakdown),
      match_id: backendMatch.match_id,
      gig_id: backendMatch.gig_id,
      status: backendMatch.status,
      created_at: backendMatch.created_at
    };
  }
};

// Generate enhanced reasoning based on AI scoring breakdown
const generateEnhancedReasoning = (breakdown: any): string => {
  const reasons = [];
  
  if (breakdown?.location > 0) reasons.push('Location compatibility');
  if (breakdown?.budget > 0) reasons.push('Budget alignment');
  if (breakdown?.skills > 0) reasons.push('Skills match');
  if (breakdown?.experience > 0) reasons.push('Experience level');
  if (breakdown?.availability > 0) reasons.push('Availability');
  if (breakdown?.styleSimilarity > 0) reasons.push('AI-powered style similarity');
  if (breakdown?.semanticMatch > 0) reasons.push('Semantic text matching');
  
  return reasons.length > 0 
    ? `Strong match in: ${reasons.join(', ')}`
    : 'General compatibility based on project requirements';
};

// Generate reasoning based on breakdown (legacy)
const generateReasoning = (breakdown: any): string => {
  const reasons = [];
  
  if (breakdown?.location > 0) reasons.push('Location compatibility');
  if (breakdown?.budget > 0) reasons.push('Budget alignment');
  if (breakdown?.skills > 0) reasons.push('Skills match');
  if (breakdown?.experience > 0) reasons.push('Experience level');
  if (breakdown?.availability > 0) reasons.push('Availability');
  if (breakdown?.styleSimilarity > 0) reasons.push('Style similarity');
  
  return reasons.length > 0 
    ? `Strong match in: ${reasons.join(', ')}`
    : 'General compatibility based on project requirements';
};

// Transform analytics response
export const transformAnalytics = (backendAnalytics: any): Analytics => {
  // Extract overview data
  const overview = backendAnalytics.overview || {};
  
  // Transform top_categories to categoryDistribution
  const categoryDistribution: Record<string, number> = {};
  if (backendAnalytics.top_categories) {
    backendAnalytics.top_categories.forEach((cat: any) => {
      categoryDistribution[cat.category] = cat.gig_count || 0;
    });
  }
  
  // Transform talent_distribution to locationInsights
  const locationInsights: Record<string, number> = {};
  if (backendAnalytics.talent_distribution) {
    backendAnalytics.talent_distribution.forEach((loc: any) => {
      locationInsights[loc.city] = loc.talent_count || 0;
    });
  }
  
  // Create budget ranges from overview data (simplified) - using Indian Rupees
  const budgetRanges: Record<string, number> = {
    '₹0-25k': Math.floor((overview.total_gigs || 0) * 0.3),
    '₹25k-50k': Math.floor((overview.total_gigs || 0) * 0.4),
    '₹50k-100k': Math.floor((overview.total_gigs || 0) * 0.2),
    '₹100k+': Math.floor((overview.total_gigs || 0) * 0.1)
  };
  
  // Extract match success data
  const matchSuccess = backendAnalytics.match_success || {};
  const totalMatches = matchSuccess.total_matches || 0;
  const selectedMatches = matchSuccess.decisions?.selected || 0;
  const matchSuccessRate = totalMatches > 0 ? Math.round((selectedMatches / totalMatches) * 100) : 0;
  
  return {
    totalTalents: overview.total_talents || 0,
    totalClients: overview.total_clients || 0,
    totalGigs: overview.total_gigs || 0,
    matchSuccessRate,
    avgProcessingTime: 2500, // Default value since not provided by backend
    categoryDistribution,
    budgetRanges,
    locationInsights
  };
}; 