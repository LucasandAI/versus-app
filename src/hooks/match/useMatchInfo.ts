
import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Club, Match, MatchTeam, ClubMember } from '@/types';
import { debounce } from 'lodash';

export const useMatchInfo = (userClubs: Club[]) => {
  const [matches, setMatches] = useState<Match[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Memoize club IDs to prevent unnecessary refetches
  const clubIds = useMemo(() => {
    return userClubs?.map(club => club?.id).filter(Boolean) || [];
  }, [userClubs]);

  // Transform the raw match data from view_full_match_info to our Match type
  const transformMatchData = useCallback((rawMatches: any[]): Match[] => {
    if (!Array.isArray(rawMatches) || rawMatches.length === 0) {
      return [];
    }
    
    return rawMatches.map(match => {
      if (!match) return null;
      
      // Parse members data for both clubs
      const parseMembers = (membersJson: any): ClubMember[] => {
        if (!membersJson) return [];
        
        try {
          return Object.values(membersJson).map((member: any) => ({
            id: member.user_id,
            name: member.name,
            avatar: member.avatar || '/placeholder.svg',
            isAdmin: member.is_admin || false,
            distanceContribution: parseFloat(member.distance || '0')
          }));
        } catch (error) {
          console.error('Error parsing members JSON:', error);
          return [];
        }
      };
      
      // Create home team data
      const homeMembers = parseMembers(match.home_club_members);
      const homeTotalDistance = match.home_total_distance ? 
        parseFloat(match.home_total_distance.toString()) : 0;
      
      const homeTeam: MatchTeam = {
        id: match.home_club_id,
        name: match.home_club_name,
        logo: match.home_club_logo || '/placeholder.svg',
        division: match.home_club_division as any,
        tier: match.home_club_tier,
        totalDistance: homeTotalDistance,
        members: homeMembers
      };
      
      // Create away team data
      const awayMembers = parseMembers(match.away_club_members);
      const awayTotalDistance = match.away_total_distance ? 
        parseFloat(match.away_total_distance.toString()) : 0;
      
      const awayTeam: MatchTeam = {
        id: match.away_club_id,
        name: match.away_club_name,
        logo: match.away_club_logo || '/placeholder.svg',
        division: match.away_club_division as any,
        tier: match.away_club_tier,
        totalDistance: awayTotalDistance,
        members: awayMembers
      };

      // Create the full match object
      return {
        id: match.match_id,
        homeClub: homeTeam,
        awayClub: awayTeam,
        startDate: match.start_date,
        endDate: match.end_date,
        status: match.status as 'active' | 'completed',
        winner: match.winner as 'home' | 'away' | 'draw' | undefined,
        leagueBeforeMatch: match.league_before_match,
        leagueAfterMatch: match.league_after_match
      };
    }).filter(Boolean) as Match[]; // Filter out any null entries
  }, []);

  // Fetch matches for the user's clubs
  const fetchMatches = useCallback(async () => {
    if (!clubIds.length) {
      setMatches([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    
    try {
      // Create a condition for "club_id IN (clubId1, clubId2, ...)" using OR conditions
      const clubConditions = clubIds.map(id => `home_club_id.eq.${id},away_club_id.eq.${id}`).join(',');
      
      // Query the view_full_match_info for active matches for the user's clubs
      const { data, error } = await supabase
        .from('view_full_match_info')
        .select('*')
        .or(clubConditions)
        .eq('status', 'active');

      if (error) {
        console.error('Error fetching matches:', error);
        setIsLoading(false);
        return;
      }

      const transformedMatches = transformMatchData(data || []);
      setMatches(transformedMatches);
    } catch (error) {
      console.error('Error processing matches:', error);
    } finally {
      setIsLoading(false);
    }
  }, [clubIds, transformMatchData]);

  // Debounce the fetch operation to prevent too many rapid updates
  const debouncedFetchMatches = useMemo(() => 
    debounce(fetchMatches, 300, { leading: true, trailing: true }),
    [fetchMatches]
  );

  useEffect(() => {
    // Only fetch if we have clubs to query for
    if (clubIds.length > 0) {
      debouncedFetchMatches();
    } else {
      setIsLoading(false);
      setMatches([]);
    }
    
    // Set up a single realtime channel for all changes
    const channel = supabase
      .channel('match-data-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'matches'
        },
        () => {
          console.log('[useMatchInfo] Match table updated, refreshing data');
          debouncedFetchMatches();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'match_distances'
        },
        () => {
          console.log('[useMatchInfo] Match distances updated, refreshing data');
          debouncedFetchMatches();
        }
      )
      .subscribe();
    
    // Listen for custom events
    const handleMatchEvent = () => {
      console.log('[useMatchInfo] Match event received, refreshing data');
      debouncedFetchMatches();
    };

    window.addEventListener('matchCreated', handleMatchEvent);
    window.addEventListener('matchUpdated', handleMatchEvent);
    window.addEventListener('matchEnded', handleMatchEvent);
    window.addEventListener('matchDistanceUpdated', handleMatchEvent);
      
    // Clean up
    return () => {
      debouncedFetchMatches.cancel();
      supabase.removeChannel(channel);
      window.removeEventListener('matchCreated', handleMatchEvent);
      window.removeEventListener('matchUpdated', handleMatchEvent);
      window.removeEventListener('matchEnded', handleMatchEvent);
      window.removeEventListener('matchDistanceUpdated', handleMatchEvent);
    };
  }, [clubIds, debouncedFetchMatches]);

  return {
    matches,
    isLoading,
    refreshMatches: debouncedFetchMatches
  };
};
