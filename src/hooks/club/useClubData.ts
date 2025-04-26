
import { useState, useEffect } from 'react';
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

  useEffect(() => {
    const loadClubData = async () => {
      if (!clubId) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        // Fetch basic club data
        const clubData = await fetchClubDetails();
        if (!clubData) return;
        
        // Fetch members and matches in parallel
        const [membersResult, matches] = await Promise.all([
          fetchClubMembers(clubId),
          fetchClubMatches(clubId)
        ]);
        
        // Ensure members is always an array, even if the fetch fails
        const members = Array.isArray(membersResult) ? membersResult : [];
        
        // Create the final club object
        const updatedClub: Club = {
          ...clubData,
          members,
          matchHistory: matches
        };
        
        setClub(updatedClub);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Error loading club data';
        console.error(message);
        setError(message);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadClubData();
  }, [clubId]);

  return { club, isLoading, error };
};
