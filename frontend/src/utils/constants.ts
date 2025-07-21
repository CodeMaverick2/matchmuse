export const CATEGORIES = [
  'Photography',
  'Animation',
  'Direction',
  'Video Editing',
  'Styling',
  'Branding',
  'Content Writing'
];

export const EXPERIENCE_LEVELS = [
  'basic',
  'intermediate',
  'pro',
  'top-tier',
  'expert'
];

export const BUDGET_RANGES = [
  { label: 'Under $1,000', min: 0, max: 1000 },
  { label: '$1,000 - $5,000', min: 1000, max: 5000 },
  { label: '$5,000 - $10,000', min: 5000, max: 10000 },
  { label: '$10,000 - $25,000', min: 10000, max: 25000 },
  { label: '$25,000+', min: 25000, max: Infinity }
];

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

export const APP_CONFIG = {
  name: import.meta.env.VITE_APP_NAME || 'MatchMuse',
  version: import.meta.env.VITE_APP_VERSION || '1.0.0',
  enableAnalytics: import.meta.env.VITE_ENABLE_ANALYTICS === 'true',
  debugMode: import.meta.env.VITE_ENABLE_DEBUG_MODE === 'true'
} as const;

export const ROUTES = {
  HOME: '/',
  TALENTS: '/talents',
  CLIENTS: '/clients',
  GIGS: '/gigs',
  MATCHMAKING: '/matchmaking',
  ANALYTICS: '/analytics'
} as const;