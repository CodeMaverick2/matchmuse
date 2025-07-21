import axios from 'axios';
import toast from 'react-hot-toast';
import { API_BASE_URL, APP_CONFIG } from '../utils/constants';
import { transformTalents, transformClients, transformGigs, transformTalent, transformClient, transformGig, transformMatchmakingResponse, transformAnalytics } from '../utils/dataTransformers';
import type { 
  Talent, 
  Client, 
  Gig, 
  Match, 
  MatchRequest, 
  Analytics, 
  ApiResponse, 
  PaginatedResponse,
  AlgorithmInfo,
  AIStatus,
  AISimilarityResponse,
  AIEmbeddingResponse,
  MatchmakingMetadata
} from '../types';

// Create axios instance with proper configuration
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for logging and debugging
api.interceptors.request.use(
  (config) => {
    if (APP_CONFIG.debugMode) {
      console.log('API Request:', config.method?.toUpperCase(), config.url, config.data);
    }
    return config;
  },
  (error) => {
    console.error('Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    if (APP_CONFIG.debugMode) {
      console.log('API Response:', response.status, response.data);
    }
    return response;
  },
  (error) => {
    const message = error.response?.data?.message || 
                   error.response?.data?.error || 
                   error.message || 
                   'An error occurred';
    
    // Don't show toast for 401/403 errors (handled by auth)
    if (error.response?.status !== 401 && error.response?.status !== 403) {
      toast.error(message);
    }
    
    console.error('Response Error:', error.response?.status, message);
    return Promise.reject(error);
  }
);

// Talents API
export const talentsApi = {
  getAll: async (): Promise<Talent[]> => {
    const response = await api.get<ApiResponse<any[]>>('/talents');
    return transformTalents(response.data.data);
  },
  
  getById: async (id: string): Promise<Talent> => {
    const response = await api.get<ApiResponse<any>>(`/talents/${id}`);
    return transformTalent(response.data.data);
  },
  
  create: async (talent: Omit<Talent, 'id' | 'created_at' | 'updated_at'>): Promise<Talent> => {
    const response = await api.post<ApiResponse<Talent>>('/talents', talent);
    toast.success('Talent created successfully!');
    return response.data.data;
  },
  
  update: async (id: string, talent: Partial<Talent>): Promise<Talent> => {
    const response = await api.put<ApiResponse<Talent>>(`/talents/${id}`, talent);
    toast.success('Talent updated successfully!');
    return response.data.data;
  },
  
  delete: async (id: string): Promise<void> => {
    await api.delete(`/talents/${id}`);
    toast.success('Talent deleted successfully!');
  }
};

// Clients API
export const clientsApi = {
  getAll: async (): Promise<Client[]> => {
    const response = await api.get<ApiResponse<any[]>>('/clients');
    return transformClients(response.data.data);
  },
  
  getById: async (id: string): Promise<Client> => {
    const response = await api.get<ApiResponse<any>>(`/clients/${id}`);
    return transformClient(response.data.data);
  },
  
  create: async (client: Omit<Client, 'id' | 'created_at' | 'updated_at'>): Promise<Client> => {
    const response = await api.post<ApiResponse<Client>>('/clients', client);
    toast.success('Client created successfully!');
    return response.data.data;
  },
  
  update: async (id: string, client: Partial<Client>): Promise<Client> => {
    const response = await api.put<ApiResponse<Client>>(`/clients/${id}`, client);
    toast.success('Client updated successfully!');
    return response.data.data;
  },
  
  delete: async (id: string): Promise<void> => {
    await api.delete(`/clients/${id}`);
    toast.success('Client deleted successfully!');
  }
};

// Gigs API
export const gigsApi = {
  getAll: async (): Promise<Gig[]> => {
    const response = await api.get<ApiResponse<any[]>>('/gigs');
    return transformGigs(response.data.data);
  },
  
  getById: async (id: string): Promise<Gig> => {
    const response = await api.get<ApiResponse<any>>(`/gigs/${id}`);
    return transformGig(response.data.data);
  },
  
  create: async (gig: Omit<Gig, 'id' | 'created_at' | 'updated_at'>): Promise<Gig> => {
    const response = await api.post<ApiResponse<Gig>>('/gigs', gig);
    toast.success('Gig created successfully!');
    return response.data.data;
  },
  
  update: async (id: string, gig: Partial<Gig>): Promise<Gig> => {
    const response = await api.put<ApiResponse<Gig>>(`/gigs/${id}`, gig);
    toast.success('Gig updated successfully!');
    return response.data.data;
  },
  
  delete: async (id: string): Promise<void> => {
    await api.delete(`/gigs/${id}`);
    toast.success('Gig deleted successfully!');
  }
};

// Enhanced Matchmaking API
export const matchmakingApi = {
  generateMatches: async (request: MatchRequest): Promise<{ gig: Gig; matches: Match[]; metadata: MatchmakingMetadata }> => {
    const response = await api.post<ApiResponse<any>>('/matchmaking/match', request);
    toast.success('Matches generated successfully!');
    return transformMatchmakingResponse(response.data.data);
  },
  
  getGigMatches: async (gigId: string, limit = 10, offset = 0, status?: string, algorithm_type?: string): Promise<{ matches: Match[]; pagination: any }> => {
    const params = new URLSearchParams({
      limit: limit.toString(),
      offset: offset.toString()
    });
    if (status) params.append('status', status);
    if (algorithm_type) params.append('algorithm_type', algorithm_type);
    
    const response = await api.get<ApiResponse<{ matches: Match[]; pagination: any }>>(`/matchmaking/gig/${gigId}/matches?${params}`);
    return response.data.data;
  },
  
  submitFeedback: async (matchId: number, feedback: { rating: number; feedback?: string; decision?: string }): Promise<void> => {
    await api.post('/matchmaking/feedback', {
      match_id: matchId,
      ...feedback
    });
    toast.success('Feedback submitted successfully!');
  },

  // New enhanced endpoints
  getAlgorithmInfo: async (): Promise<AlgorithmInfo> => {
    const response = await api.get<ApiResponse<AlgorithmInfo>>('/matchmaking/algorithm/info');
    return response.data.data;
  },

  verifyAlgorithm: async (gigId: string, options = {}): Promise<any> => {
    const response = await api.post<ApiResponse<any>>('/matchmaking/algorithm/verify', {
      gig_id: gigId,
      options
    });
    return response.data.data;
  },

  getMatchmakingStats: async (): Promise<any> => {
    const response = await api.get<ApiResponse<any>>('/matchmaking/stats');
    return response.data.data;
  },

  getMatchmakingHealth: async (): Promise<any> => {
    const response = await api.get<ApiResponse<any>>('/matchmaking/health');
    return response.data.data;
  }
};

// AI API
export const aiApi = {
  getStatus: async (): Promise<AIStatus> => {
    const response = await api.get<ApiResponse<AIStatus>>('/ai/status');
    return response.data.data;
  },

  generateEmbeddings: async (text: string): Promise<AIEmbeddingResponse> => {
    const response = await api.post<ApiResponse<AIEmbeddingResponse>>('/ai/generate-embeddings', { text });
    return response.data.data;
  },

  calculateSimilarity: async (text1: string, text2: string): Promise<AISimilarityResponse> => {
    const response = await api.post<ApiResponse<AISimilarityResponse>>('/ai/calculate-similarity', { text1, text2 });
    return response.data.data;
  }
};

// Analytics API
export const analyticsApi = {
  getAnalytics: async (period = '30d'): Promise<Analytics> => {
    const response = await api.get<ApiResponse<any>>(`/analytics?period=${period}`);
    return transformAnalytics(response.data.data);
  }
};

// Health API
export const healthApi = {
  getHealth: async (): Promise<{ status: string }> => {
    const response = await api.get<ApiResponse<{ status: string }>>('/health');
    return response.data.data;
  },
  
  getDetailedHealth: async (): Promise<any> => {
    const response = await api.get<ApiResponse<any>>('/health/detailed');
    return response.data.data;
  }
};

export default api;