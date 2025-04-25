
import { useState, useEffect, useCallback } from 'react';
import { Club } from '@/types';
import { useApp } from '@/context/AppContext';
import { useClubDetails } from './useClubDetails';
import { useClubMembers } from './useClubMembers';
import { useClubMatches } from './useClubMatches';

export const useClubData = (clubId: string | undefined) => {
  const { selectedClub } = useApp();
  const [club, setClub] = useState<Club | null>(selectedClub || null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

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
      console.log('[useClubData] Fetching club data for:', clubId);
      const clubData = await fetchClubDetails();
      
      if (!clubData) {
        console.error('[useClubData] No club data returned for ID:', clubId);
        setError('Could not find club data');
        setIsLoading(false);
        return;
      }

      console.log('[useClubData] Club details fetched:', clubData);

      const [members, matches] = await Promise.all([
        fetchClubMembers(clubId),
        fetchClubMatches(clubId),
      ]);

      console.log('[useClubData] Members fetched:', members.length);
      console.log('[useClubData] Matches fetched:', matches.length);

      const updatedClub: Club = {
        ...clubData,
        members,
        matchHistory: matches,
      };

      console.log('[useClubData] Setting complete club data:', updatedClub);
      setClub(updatedClub);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error loading club data';
      console.error('[useClubData] Error:', message);
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [clubId, fetchClubDetails, fetchClubMembers, fetchClubMatches]);

  // When selectedClub changes or component mounts, update the state
  useEffect(() => {
    if (selectedClub && (!clubId || selectedClub.id === clubId)) {
      console.log('[useClubData] Using selectedClub directly:', selectedClub);
      
      // If selectedClub exists but doesn't have members or matchHistory, we still need to fetch them
      if (selectedClub.members?.length === 0 || !selectedClub.matchHistory) {
        console.log('[useClubData] Selected club missing data, fetching full data');
        loadClubData();
      } else {
        setClub(selectedClub);
        setIsLoading(false);
      }
    } else if (clubId) {
      console.log('[useClubData] No complete selectedClub available, fetching from DB');
      loadClubData();
    } else {
      setIsLoading(false);
    }
  }, [selectedClub, clubId, loadClubData]);

  const refetchClub = useCallback(() => {
    return loadClubData();
  }, [loadClubData]);

  return { club, isLoading, error, refetchClub };
};
