
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
    if (!clubId) {
      console.log('[useClubData] No clubId provided, skipping data fetch');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('[useClubData] Fetching club data for:', clubId);
      // Fetch basic club data
      const clubData = await fetchClubDetails();
      if (!clubData) {
        console.error('[useClubData] fetchClubDetails returned no data');
        setError('Could not load club details');
        setIsLoading(false);
        return;
      }
      
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
      
      console.log('[useClubData] Successfully loaded club data:', updatedClub);
      setClub(updatedClub);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error loading club data';
      console.error('[useClubData] Error:', message);
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [clubId, fetchClubDetails, fetchClubMembers, fetchClubMatches]);

  // Initial data load - only when clubId is available
  useEffect(() => {
    if (clubId) {
      console.log('[useClubData] clubId available, initiating data load:', clubId);
      loadClubData();
    } else {
      console.log('[useClubData] No clubId yet, waiting...');
    }
  }, [loadClubData, clubId]);

  // Return the refetch function to allow manual refreshing
  const refetchClub = useCallback(() => {
    console.log('[useClubData] Manual refresh requested');
    return loadClubData();
  }, [loadClubData]);

  return { club, isLoading, error, refetchClub };
};
