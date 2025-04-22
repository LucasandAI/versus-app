
import { useState, useEffect, useCallback } from 'react';
import { Club } from '@/types';
import { useClubDetails } from './useClubDetails';
import { useClubMembers } from './useClubMembers';
import { useClubMatches } from './useClubMatches';
import { toast } from "@/components/ui/use-toast";

export const useClubData = (clubId: string | undefined) => {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [club, setClub] = useState<Club | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [lastError, setLastError] = useState<Error | null>(null);

  const { fetchClubDetails } = useClubDetails(clubId);
  const { fetchClubMembers } = useClubMembers();
  const { fetchClubMatches } = useClubMatches();

  const loadClubData = useCallback(async () => {
    if (!clubId) {
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      console.log(`Attempting to load club data for ID: ${clubId}`);
      
      // Fetch basic club data
      const clubData = await fetchClubDetails();
      if (!clubData) {
        throw new Error("Failed to fetch club details");
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
      
      setClub(updatedClub);
      setLastError(null);
      setRetryCount(0);
    } catch (error) {
      setLastError(error instanceof Error ? error : new Error(String(error)));
      const message = error instanceof Error ? error.message : 'Error loading club data';
      console.error(`Error loading club (attempt ${retryCount + 1}):`, message);
      setError(message);
      
      // Only show toast on first error to avoid spam
      if (retryCount === 0) {
        toast({
          title: "Error Loading Club",
          description: "There was a problem loading the club data. Retrying...",
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
    }
  }, [clubId, fetchClubDetails, fetchClubMembers, fetchClubMatches, retryCount]);

  // Initial load and retries
  useEffect(() => {
    loadClubData();
    
    // Set up automatic retry for network errors
    let retryTimeout: NodeJS.Timeout | null = null;
    
    if (error && retryCount < 3) {
      console.log(`Scheduling retry ${retryCount + 1} in ${(retryCount + 1) * 2} seconds`);
      retryTimeout = setTimeout(() => {
        setRetryCount(prev => prev + 1);
      }, (retryCount + 1) * 2000); // Increasing backoff
    }
    
    return () => {
      if (retryTimeout) clearTimeout(retryTimeout);
    };
  }, [clubId, loadClubData, retryCount, error]);

  // Return the refresh function along with the data
  return { 
    club, 
    isLoading, 
    error, 
    lastError,
    retryCount,
    refreshClubData: useCallback(() => {
      setRetryCount(0); // Reset retry count for manual refresh
      return loadClubData();
    }, [loadClubData]) 
  };
};
