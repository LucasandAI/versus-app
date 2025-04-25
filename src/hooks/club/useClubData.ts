
import { useState, useEffect, useCallback } from 'react';
import { Club } from '@/types';
import { useClubDetails } from './useClubDetails';
import { useClubMembers } from './useClubMembers';
import { useClubMatches } from './useClubMatches';

export const useClubData = (clubId: string | undefined) => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [club, setClub] = useState<Club | null>(null);

  const { fetchClubDetails } = useClubDetails(clubId);
  const { fetchClubMembers } = useClubMembers();
  const { fetchClubMatches } = useClubMatches();

  const loadClubData = useCallback(async () => {
    if (!clubId) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('[useClubData] Fetching club data for:', clubId);
      // Fetch basic club data
      const clubData = await fetchClubDetails();
      if (!clubData) return;
      
      // Fetch members and matches in parallel
      const [members, matches] = await Promise.all([
        fetchClubMembers(clubId),
        fetchClubMatches(clubId)
      ]);
      
      // Create the final club object
      const updatedClub: Club = {
        ...clubData,
        members,
        matchHistory: matches
      };
      
      setClub(updatedClub);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error loading club data';
      console.error('[useClubData] Error:', message);
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [clubId, fetchClubDetails, fetchClubMembers, fetchClubMatches]);

  // Initial data load
  useEffect(() => {
    loadClubData();
  }, [loadClubData]);

  // Return the refetch function to allow manual refreshing
  const refetchClub = useCallback(() => {
    return loadClubData();
  }, [loadClubData]);

  return { club, isLoading, error, refetchClub };
};
