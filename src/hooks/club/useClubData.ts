
import { useState, useEffect } from 'react';
import { Club } from '@/types';
import { useClubDetails } from './useClubDetails';
import { useClubMembers } from './useClubMembers';
import { useClubMatches } from './useClubMatches';
import { ensureDivision } from '@/utils/club/leagueUtils';

export const useClubData = (clubId: string | undefined) => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [club, setClub] = useState<Club | null>(null);

  const { fetchClubDetails } = useClubDetails(clubId);
  const { fetchClubMembers } = useClubMembers();
  const { fetchClubMatches } = useClubMatches();

  useEffect(() => {
    const loadClubData = async () => {
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
        
        setClub(updatedClub);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Error loading club data';
        console.error('[useClubData] Error:', message);
        setError(message);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadClubData();
  }, [clubId, fetchClubDetails, fetchClubMembers, fetchClubMatches]);

  return { club, isLoading, error };
};
