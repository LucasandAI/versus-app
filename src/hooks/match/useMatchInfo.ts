
import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Club, Match } from '@/types';
import { debounce } from 'lodash';
import { 
  transformMatchData, 
  getClubIdsString, 
  clearMatchCache 
} from '@/utils/match/matchTransformUtils';

export const useMatchInfo = (userClubs: Club[]) => {
  const [matches, setMatches] = useState<Match[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Extract club IDs for efficient dependency tracking
  const clubIds = useMemo(() => getClubIdsString(userClubs), [userClubs]);

  // Optimized fetch function with minimal query fields
  const fetchMatches = useCallback(async (forceRefresh = false) => {
    if (!userClubs || userClubs.length === 0) {
      setMatches([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    
    // Clear cache if force refresh
    if (forceRefresh) {
      clearMatchCache();
    }
    
    try {
      const clubIdsList = userClubs.map(club => club.id).filter(Boolean);
      if (clubIdsList.length === 0) {
        setMatches([]);
        setIsLoading(false);
        return;
      }
      
      // Use a more efficient query with only necessary fields
      const { data, error } = await supabase
        .from('view_full_match_info')
        .select('*')
        .or(clubIdsList.map(id => `home_club_id.eq.${id},away_club_id.eq.${id}`).join(','))
        .eq('status', 'active');

      if (error) {
        console.error('Error fetching matches:', error);
        setIsLoading(false);
        return;
      }

      // Process each match with the shared utility function
      const transformedMatches = data?.map(match => {
        // Find which club this match belongs to (from user's clubs)
        const userClubId = userClubs.find(club => 
          club.id === match.home_club_id || club.id === match.away_club_id
        )?.id || '';
        
        return transformMatchData(match, userClubId);
      }) || [];
      
      setMatches(transformedMatches);
    } catch (error) {
      console.error('Error processing matches:', error);
    } finally {
      setIsLoading(false);
    }
  }, [clubIds]); // Depend only on club IDs instead of full objects

  // Reduced debounce time from 300ms to 50ms for faster response
  const debouncedFetchMatches = useMemo(() => 
    debounce(fetchMatches, 50), 
  [fetchMatches]);

  useEffect(() => {
    debouncedFetchMatches();
    
    // Set up realtime subscription for matches with immediate return
    const matchChannel = supabase
      .channel('matches-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'matches'
        },
        () => {
          debouncedFetchMatches();
        }
      )
      .subscribe();
    
    // Listen for match distance updates
    const distanceChannel = supabase
      .channel('match-distances-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'match_distances'
        },
        () => {
          debouncedFetchMatches();
        }
      )
      .subscribe();

    // Listen for custom events
    const handleMatchEvent = () => {
      debouncedFetchMatches(true); // Force refresh on manual events
    };

    window.addEventListener('matchCreated', handleMatchEvent);
    window.addEventListener('matchUpdated', handleMatchEvent);
    window.addEventListener('matchEnded', handleMatchEvent);
      
    // Clean up
    return () => {
      debouncedFetchMatches.cancel();
      supabase.removeChannel(matchChannel);
      supabase.removeChannel(distanceChannel);
      window.removeEventListener('matchCreated', handleMatchEvent);
      window.removeEventListener('matchUpdated', handleMatchEvent);
      window.removeEventListener('matchEnded', handleMatchEvent);
    };
  }, [debouncedFetchMatches]);

  return {
    matches,
    isLoading,
    refreshMatches: useCallback(() => fetchMatches(true), [fetchMatches])
  };
};
