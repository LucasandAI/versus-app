
import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Club, Match } from '@/types';
import { debounce } from 'lodash';
import { 
  transformMatchData, 
  getClubIdsString, 
  clearMatchCache,
  getCachedPreviewData
} from '@/utils/match/matchTransformUtils';

export const useMatchInfo = (userClubs: Club[]) => {
  const [matches, setMatches] = useState<Match[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasPreviewData, setHasPreviewData] = useState(false);
  
  // Extract club IDs for efficient dependency tracking
  const clubIds = useMemo(() => getClubIdsString(userClubs), [userClubs]);

  // Check for cached preview data first
  const loadPreviewData = useCallback(() => {
    if (!userClubs || userClubs.length === 0) return;
    
    const previewMatches: Match[] = [];
    
    userClubs.forEach(club => {
      // Try to get cached preview data for each club's potential matches
      const cachedMatch = getCachedPreviewData('', club.id);
      if (cachedMatch) {
        previewMatches.push(cachedMatch);
      }
    });
    
    if (previewMatches.length > 0) {
      setMatches(previewMatches);
      setHasPreviewData(true);
      setIsLoading(false);
      console.log('[useMatchInfo] Loaded preview data from cache');
    }
  }, [userClubs]);

  // Optimized fetch function with progressive loading
  const fetchMatches = useCallback(async (forceRefresh = false, loadFullData = true) => {
    if (!userClubs || userClubs.length === 0) {
      setMatches([]);
      setIsLoading(false);
      return;
    }

    // Don't set loading if we already have preview data
    if (!hasPreviewData) {
      setIsLoading(true);
    }
    
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
      
      // Choose query based on whether we need full data or preview
      const selectFields = loadFullData ? '*' : `
        match_id,
        status,
        start_date,
        end_date,
        home_club_id,
        away_club_id,
        home_club_name,
        away_club_name,
        home_club_logo,
        away_club_logo,
        home_club_division,
        away_club_division,
        home_club_tier,
        away_club_tier,
        home_total_distance,
        away_total_distance,
        winner
      `;
      
      const { data, error } = await supabase
        .from('view_full_match_info')
        .select(selectFields)
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
        
        return transformMatchData(match, userClubId, !loadFullData);
      }) || [];
      
      setMatches(transformedMatches);
      
      // If this was preview data, schedule full data load
      if (!loadFullData && transformedMatches.length > 0) {
        setHasPreviewData(true);
        // Load full data in background after a short delay
        setTimeout(() => {
          fetchMatches(false, true);
        }, 100);
      }
      
    } catch (error) {
      console.error('Error processing matches:', error);
    } finally {
      setIsLoading(false);
    }
  }, [clubIds, hasPreviewData, userClubs]);

  // Reduced debounce time for faster response
  const debouncedFetchMatches = useMemo(() => 
    debounce(fetchMatches, 50), 
  [fetchMatches]);

  useEffect(() => {
    // First try to load preview data from cache
    loadPreviewData();
    
    // Then fetch fresh data
    debouncedFetchMatches();
    
    // Set up realtime subscription for matches
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
      debouncedFetchMatches(true);
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
  }, [debouncedFetchMatches, loadPreviewData]);

  return {
    matches,
    isLoading,
    refreshMatches: useCallback(() => fetchMatches(true), [fetchMatches])
  };
};
