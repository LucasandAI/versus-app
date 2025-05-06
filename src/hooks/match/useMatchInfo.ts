
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Club, Match, MatchTeam, ClubMember } from '@/types';

export const useMatchInfo = (userClubs: Club[]) => {
  const [matches, setMatches] = useState<Match[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Transform the raw match data from view_full_match_info to our Match type
  const transformMatchData = (rawMatches: any[]): Match[] => {
    return rawMatches.map(match => {
      // Determine if the user's club is home or away
      const userClubId = userClubs.find(club => 
        club.id === match.home_club_id || club.id === match.away_club_id
      )?.id;
      
      const isUserClubHome = userClubId === match.home_club_id;
      
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
      
      // Calculate total distance for each team
      const calculateTotalDistance = (members: ClubMember[]): number => {
        return members.reduce((sum, member) => sum + (member.distanceContribution || 0), 0);
      };
      
      // Create home team data
      const homeMembers = parseMembers(match.home_members);
      const homeTotalDistance = calculateTotalDistance(homeMembers);
      
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
      const awayMembers = parseMembers(match.away_members);
      const awayTotalDistance = calculateTotalDistance(awayMembers);
      
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
        winner: match.winner as 'home' | 'away' | 'draw' | undefined
      };
    });
  };

  // Fetch matches for the user's clubs
  const fetchMatches = async () => {
    if (!userClubs || userClubs.length === 0) {
      setMatches([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    
    try {
      const clubIds = userClubs.map(club => club.id);
      
      // Query the view_full_match_info for active matches for the user's clubs
      const { data, error } = await supabase
        .from('view_full_match_info')
        .select('*')
        .or(clubIds.map(id => `home_club_id.eq.${id},away_club_id.eq.${id}`).join(','))
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
  };

  useEffect(() => {
    fetchMatches();
    
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
          fetchMatches();
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
          fetchMatches();
        }
      )
      .subscribe();

    // Listen for custom events
    const handleMatchEvent = () => {
      fetchMatches();
    };

    window.addEventListener('matchCreated', handleMatchEvent);
    window.addEventListener('matchUpdated', handleMatchEvent);
    window.addEventListener('matchEnded', handleMatchEvent);
      
    // Clean up
    return () => {
      supabase.removeChannel(matchChannel);
      supabase.removeChannel(distanceChannel);
      window.removeEventListener('matchCreated', handleMatchEvent);
      window.removeEventListener('matchUpdated', handleMatchEvent);
      window.removeEventListener('matchEnded', handleMatchEvent);
    };
  }, [JSON.stringify(userClubs)]);

  return {
    matches,
    isLoading,
    refreshMatches: fetchMatches
  };
};
