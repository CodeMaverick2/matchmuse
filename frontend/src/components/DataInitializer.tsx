import React, { useEffect } from 'react';
import { useAppStore } from '../stores/useAppStore';
import { talentsApi, clientsApi, gigsApi, analyticsApi } from '../services/api';

export const DataInitializer: React.FC = () => {
  const { 
    setTalents, 
    setClients, 
    setGigs, 
    setAnalytics, 
    setIsLoading 
  } = useAppStore();

  useEffect(() => {
    const initializeData = async () => {
      try {
        setIsLoading(true);
        
        // Load all data in parallel
        const [talents, clients, gigs, analytics] = await Promise.all([
          talentsApi.getAll(),
          clientsApi.getAll(),
          gigsApi.getAll(),
          analyticsApi.getAnalytics()
        ]);

        // Update store with loaded data
        setTalents(talents);
        setClients(clients);
        setGigs(gigs);
        setAnalytics(analytics);
        
      } catch (error) {
        console.error('Failed to initialize app data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeData();
  }, [setTalents, setClients, setGigs, setAnalytics, setIsLoading]);

  return null; // This component doesn't render anything
}; 