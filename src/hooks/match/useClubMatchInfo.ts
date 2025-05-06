
import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Match, MatchTeam, ClubMember } from '@/types';

export const useClubMatchInfo = (clubId: string | undefined) => {
  const [match, setMatch] = useState<Match | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastFetchTime, setLastFetchTime] = useState(0);

  // Transform the raw match data from view_full_match_info to our Match type
  const transformMatchData = useCallback((rawMatch: any): Match | null => {
    if (!rawMatch) return null;
    
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
    const homeMembers = parseMembers(rawMatch.home_club_members);
    const homeTotalDistance = rawMatch.home_total_distance ? 
      parseFloat(rawMatch.home_total_distance.toString()) : 0;
    
    const homeTeam: MatchTeam = {
      id: rawMatch.home_club_id,
      name: rawMatch.home_club_name,
      logo: rawMatch.home_club_logo || '/placeholder.svg',
      division: rawMatch.home_club_division as any,
      tier: rawMatch.home_club_tier,
      totalDistance: homeTotalDistance,
      members: homeMembers
    };
    
    // Create away team data
    const awayMembers = parseMembers(rawMatch.away_club_members);
    const awayTotalDistance = rawMatch.away_total_distance ? 
      parseFloat(rawMatch.away_total_distance.toString()) : 0;
    
    const awayTeam: MatchTeam = {
      id: rawMatch.away_club_id,
      name: rawMatch.away_club_name,
      logo: rawMatch.away_club_logo || '/placeholder.svg',
      division: rawMatch.away_club_division as any,
      tier: rawMatch.away_club_tier,
      totalDistance: awayTotalDistance,
      members: awayMembers
    };

    // Create the full match object
    return {
      id: rawMatch.match_id,
      homeClub: homeTeam,
      awayClub: awayTeam,
      startDate: rawMatch.start_date,
      endDate: rawMatch.end_date,
      status: rawMatch.status as 'active' | 'completed',
      winner: rawMatch.winner as 'home' | 'away' | 'draw' | undefined,
      leagueBeforeMatch: rawMatch.league_before_match,
      leagueAfterMatch: rawMatch.league_after_match
    };
  }, []);

  const fetchClubMatch = useCallback(async () => {
    // Debounce fetches that happen too quickly
    const now = Date.now();
    if (now - lastFetchTime < 500) {
      console.log('[useClubMatchInfo] Skipping fetch, too soon since last fetch');
      return;
    }

    if (!clubId) {
      setMatch(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setLastFetchTime(now);
    
    try {
      console.log('[useClubMatchInfo] Fetching match for club:', clubId);
      
      // Query the view_full_match_info for active matches for this club
      const { data, error } = await supabase
        .from('view_full_match_info')
        .select('*')
        .or(`home_club_id.eq.${clubId},away_club_id.eq.${clubId}`)
        .eq('status', 'active')
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('Error fetching club match:', error);
        setMatch(null);
      } else {
        const transformedMatch = data ? transformMatchData(data) : null;
        console.log('[useClubMatchInfo] Fetched match:', transformedMatch);
        setMatch(transformedMatch);
      }
    } catch (error) {
      console.error('Error processing club match:', error);
      setMatch(null);
    } finally {
      setIsLoading(false);
    }
  }, [clubId, transformMatchData, lastFetchTime]);

  useEffect(() => {
    if (clubId) {
      fetchClubMatch();
    
      // Set up realtime subscriptions
      const channel = supabase
        .channel(`club-match-changes-${clubId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'matches',
            filter: `home_club_id=eq.${clubId}`
          },
          () => {
            console.log('[useClubMatchInfo] Home club match updated, refreshing data');
            fetchClubMatch();
          }
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'matches',
            filter: `away_club_id=eq.${clubId}`
          },
          () => {
            console.log('[useClubMatchInfo] Away club match updated, refreshing data');
            fetchClubMatch();
          }
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'match_distances',
            filter: `club_id=eq.${clubId}`
          },
          () => {
            console.log('[useClubMatchInfo] Match distances updated, refreshing data');
            fetchClubMatch();
          }
        )
        .subscribe();
      
      // Use a single event listener with debouncing for all match events
      const handleMatchEvent = (event: Event) => {
        const customEvent = event as CustomEvent;
        if (
          !customEvent.detail || 
          !customEvent.detail.clubId || 
          customEvent.detail.clubId === clubId
        ) {
          console.log('[useClubMatchInfo] Match event received, refreshing data');
          fetchClubMatch();
        }
      };

      window.addEventListener('matchCreated', handleMatchEvent);
      window.addEventListener('matchUpdated', handleMatchEvent);
      window.addEventListener('matchEnded', handleMatchEvent);
      window.addEventListener('matchDistanceUpdated', handleMatchEvent);
        
      // Clean up
      return () => {
        supabase.removeChannel(channel);
        window.removeEventListener('matchCreated', handleMatchEvent);
        window.removeEventListener('matchUpdated', handleMatchEvent);
        window.removeEventListener('matchEnded', handleMatchEvent);
        window.removeEventListener('matchDistanceUpdated', handleMatchEvent);
      };
    }
  }, [clubId, fetchClubMatch]);

  // Memoize the return value to prevent unnecessary rerenders
  const returnValue = useMemo(() => ({
    match,
    isLoading,
    refreshMatch: fetchClubMatch
  }), [match, isLoading, fetchClubMatch]);

  return returnValue;
};
