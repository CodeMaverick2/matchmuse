import React, { useEffect } from 'react';
import { useAppStore } from '../stores/useAppStore';
import { talentsApi, clientsApi, gigsApi, analyticsApi } from '../services/api';
import api from '../services/api';

export const DataInitializer: React.FC = () => {
  const { 
    setTalents, 
    setClients, 
    setGigs, 
    setAnalytics, 
    setIsLoading,
    setTalentCount,
    setClientCount,
    setGigCount
  } = useAppStore();

  useEffect(() => {
    const initializeData = async () => {
      try {
        setIsLoading(true);
        // Fetch first page with limit=1 to get total counts
        const [talentsRes, clientsRes, gigsRes, analytics] = await Promise.all([
          api.get('/talents?limit=1'),
          api.get('/clients?limit=1'),
          api.get('/gigs?limit=1'),
          analyticsApi.getAnalytics()
        ]);
        setTalentCount(talentsRes.data.pagination.total ? parseInt(talentsRes.data.pagination.total) : 0);
        setClientCount(clientsRes.data.pagination.total ? parseInt(clientsRes.data.pagination.total) : 0);
        setGigCount(gigsRes.data.pagination.total ? parseInt(gigsRes.data.pagination.total) : 0);
        // Optionally, still load the first page of data for the store
        setTalents(talentsRes.data.data);
        setClients(clientsRes.data.data);
        setGigs(gigsRes.data.data);
        setAnalytics(analytics);
      } catch (error) {
        console.error('Failed to initialize app data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    initializeData();
  }, [setTalents, setClients, setGigs, setAnalytics, setIsLoading, setTalentCount, setClientCount, setGigCount]);
  return null;
}; 