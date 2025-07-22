import { create } from 'zustand';
import type { Talent, Client, Gig, Match, Analytics } from '../types';

interface AppState {
  // Data - Initialize with dummy data
  talents: Talent[];
  clients: Client[];
  gigs: Gig[];
  matches: Match[];
  analytics: Analytics | null;
  talentCount: number;
  clientCount: number;
  gigCount: number;
  // UI State
  isLoading: boolean;
  searchTerm: string;
  selectedCategory: string;
  selectedLocation: string;
  // Actions
  setTalents: (talents: Talent[]) => void;
  setClients: (clients: Client[]) => void;
  setGigs: (gigs: Gig[]) => void;
  setMatches: (matches: Match[]) => void;
  setAnalytics: (analytics: Analytics) => void;
  setTalentCount: (count: number) => void;
  setClientCount: (count: number) => void;
  setGigCount: (count: number) => void;
  setIsLoading: (loading: boolean) => void;
  setSearchTerm: (term: string) => void;
  setSelectedCategory: (category: string) => void;
  setSelectedLocation: (location: string) => void;
  // Computed
  filteredTalents: () => Talent[];
  filteredClients: () => Client[];
  filteredGigs: () => Gig[];
}

export const useAppStore = create<AppState>((set, get) => ({
  // Initialize with empty arrays - data will be loaded from API
  talents: [],
  clients: [],
  gigs: [],
  matches: [],
  analytics: null,
  talentCount: 0,
  clientCount: 0,
  gigCount: 0,
  isLoading: false,
  searchTerm: '',
  selectedCategory: '',
  selectedLocation: '',
  // Actions
  setTalents: (talents) => set({ talents }),
  setClients: (clients) => set({ clients }),
  setGigs: (gigs) => set({ gigs }),
  setMatches: (matches) => set({ matches }),
  setAnalytics: (analytics) => set({ analytics }),
  setTalentCount: (count) => set({ talentCount: count }),
  setClientCount: (count) => set({ clientCount: count }),
  setGigCount: (count) => set({ gigCount: count }),
  setIsLoading: (loading) => set({ isLoading: loading }),
  setSearchTerm: (term) => set({ searchTerm: term }),
  setSelectedCategory: (category) => set({ selectedCategory: category }),
  setSelectedLocation: (location) => set({ selectedLocation: location }),
  // Computed
  filteredTalents: () => {
    const { talents, searchTerm, selectedCategory, selectedLocation } = get();
    return talents.filter(talent => {
      const matchesSearch = !searchTerm || 
        talent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        talent.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        talent.skills.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = !selectedCategory || talent.category === selectedCategory;
      const matchesLocation = !selectedLocation || talent.location === selectedLocation;
      return matchesSearch && matchesCategory && matchesLocation;
    });
  },
  filteredClients: () => {
    const { clients, searchTerm, selectedLocation } = get();
    return clients.filter(client => {
      const matchesSearch = !searchTerm || 
        client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.company.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesLocation = !selectedLocation || client.location === selectedLocation;
      return matchesSearch && matchesLocation;
    });
  },
  filteredGigs: () => {
    const { gigs, searchTerm, selectedCategory, selectedLocation } = get();
    return gigs.filter(gig => {
      const matchesSearch = !searchTerm || 
        gig.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        gig.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = !selectedCategory || gig.category === selectedCategory;
      const matchesLocation = !selectedLocation || gig.location === selectedLocation;
      return matchesSearch && matchesCategory && matchesLocation;
    });
  }
}));