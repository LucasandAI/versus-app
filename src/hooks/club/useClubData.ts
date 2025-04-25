
import { useState, useEffect, useCallback } from 'react';
import { Club } from '@/types';
import { useApp } from '@/context/AppContext';
import { useClubDetails } from './useClubDetails';
import { useClubMembers } from './useClubMembers';
import { useClubMatches } from './useClubMatches';

export const useClubData = (clubId: string | undefined) => {
  const { selectedClub } = useApp();
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

  // Set local state from selectedClub if it's updated
  useEffect(() => {
    if (selectedClub && selectedClub.id === clubId) {
      setClub(selectedClub);
    }
  }, [selectedClub, clubId]);

  // Load fresh data on mount or clubId change
  useEffect(() => {
    if (clubId) {
      loadClubData();
    }
  }, [loadClubData, clubId]);

  const refetchClub = useCallback(() => {
    return loadClubData();
  }, [loadClubData]);

  return { club, isLoading, error, refetchClub };
};
