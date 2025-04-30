
import { useState, useEffect, useCallback } from 'react';
import { Club } from '@/types';
import { useClubDetails } from './useClubDetails';
import { useClubMembers } from './useClubMembers';
import { useClubMatches } from './useClubMatches';
import { useApp } from '@/context/AppContext';

export const useClubData = (clubId: string | undefined) => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [club, setClub] = useState<Club | null>(null);
  const { setSelectedClub } = useApp();

  const { fetchClubDetails } = useClubDetails(clubId);
  const { fetchClubMembers } = useClubMembers();
  const { fetchClubMatches } = useClubMatches();

  const loadClubData = useCallback(async () => {
    if (!clubId) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Fetch basic club data
      const clubData = await fetchClubDetails();
      if (!clubData) {
        throw new Error('Could not fetch club details');
      }
      
      console.log('[useClubData] Basic club data fetched:', clubData);
      
      // Fetch members and matches in parallel
      const [members, matches] = await Promise.all([
        fetchClubMembers(clubId),
        fetchClubMatches(clubId)
      ]);
      
      console.log('[useClubData] Members fetched:', members);
      console.log('[useClubData] Matches fetched:', matches);
      
      // Find current active match if any
      const currentMatch = matches && Array.isArray(matches) 
        ? matches.find(m => m.status === 'active') 
        : null;
      
      // Create the final club object with safe defaults
      const updatedClub: Club = {
        ...clubData,
        members: members || [],
        matchHistory: matches || [],
        currentMatch: currentMatch || null
      };
      
      console.log('[useClubData] Complete club object created:', updatedClub);
      
      // Update local state and global context with the hydrated club
      setClub(updatedClub);
      
      // Update global context with the fully hydrated club
      setSelectedClub(updatedClub);
      
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error loading club data';
      console.error('[useClubData] Error:', message);
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [clubId, fetchClubDetails, fetchClubMembers, fetchClubMatches, setSelectedClub]);

  useEffect(() => {
    loadClubData();
    
    // Add event listener for userDataUpdated
    const handleDataUpdate = () => {
      loadClubData();
    };

    window.addEventListener('userDataUpdated', handleDataUpdate);
    
    return () => {
      window.removeEventListener('userDataUpdated', handleDataUpdate);
    };
  }, [loadClubData]);

  return { club, isLoading, error, refreshClubData: loadClubData };
};
