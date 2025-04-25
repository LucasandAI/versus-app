
import { useState, useEffect, useCallback } from 'react';
import { Club } from '@/types';
import { useApp } from '@/context/AppContext';
import { useClubDetails } from './useClubDetails';
import { useClubMembers } from './useClubMembers';
import { useClubMatches } from './useClubMatches';

export const useClubData = (clubId: string | undefined) => {
  const { selectedClub } = useApp();
  const [club, setClub] = useState<Club | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const { fetchClubDetails } = useClubDetails(clubId);
  const { fetchClubMembers } = useClubMembers();
  const { fetchClubMatches } = useClubMatches();

  const loadClubData = useCallback(async () => {
    if (!clubId) return;

    setIsLoading(true);
    setError(null);

    try {
      console.log('[useClubData] Fetching club data for:', clubId);
      const clubData = await fetchClubDetails();
      if (!clubData) return;

      const [members, matches] = await Promise.all([
        fetchClubMembers(clubId),
        fetchClubMatches(clubId),
      ]);

      const updatedClub: Club = {
        ...clubData,
        members,
        matchHistory: matches,
      };

      setClub(updatedClub);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error loading club data';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [clubId, fetchClubDetails, fetchClubMembers, fetchClubMatches]);

  // When selectedClub changes, prioritize showing it immediately
  useEffect(() => {
    if (selectedClub && (!clubId || selectedClub.id === clubId)) {
      console.log('[useClubData] Using selectedClub directly');
      setClub(selectedClub);
      setIsLoading(false);
    } else if (clubId) {
      console.log('[useClubData] No selectedClub available, fetching from DB');
      loadClubData();
    }
  }, [selectedClub, clubId, loadClubData]);

  const refetchClub = useCallback(() => {
    return loadClubData();
  }, [loadClubData]);

  return { club, isLoading, error, refetchClub };
};
