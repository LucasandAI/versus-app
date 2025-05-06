import React, { useState, useEffect } from 'react';
import { Match, Club } from '@/types';
import { Card, CardContent } from "@/components/ui/card";
import { useApp } from '@/context/AppContext';
import SearchOpponentButton from '@/components/match/SearchOpponentButton';
import NeedMoreMembersCard from '@/components/match/NeedMoreMembersCard';
import CurrentMatchCard from '@/components/match/CurrentMatchCard';
import { supabase } from '@/integrations/supabase/client';
import { ensureDivision } from '@/utils/club/leagueUtils';

interface ClubCurrentMatchProps {
  match?: Match;
  onViewProfile: (userId: string, name: string, avatar?: string) => void;
  forceShowDetails?: boolean;
  clubId?: string;
}

const ClubCurrentMatch: React.FC<ClubCurrentMatchProps> = ({
  match: initialMatch,
  onViewProfile,
  forceShowDetails = false,
  clubId
}) => {
  const { selectedClub } = useApp();
  const [match, setMatch] = useState<Match | undefined>(initialMatch);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  // Fetch active match directly from view_full_match_info
  useEffect(() => {
    const fetchActiveMatch = async () => {
      if (!clubId && !selectedClub?.id) return;
      
      const targetClubId = clubId || selectedClub?.id;
      
      setIsLoading(true);
      try {
        console.log('[ClubCurrentMatch] Fetching active match for club:', targetClubId);
        const { data, error } = await supabase
          .from('view_full_match_info')
          .select('*')
          .or(`home_club_id.eq.${targetClubId},away_club_id.eq.${targetClubId}`)
          .eq('status', 'active')
          .maybeSingle();

        if (error) {
          console.error('[ClubCurrentMatch] Error fetching match:', error);
          setIsLoading(false);
          return;
        }
        
        if (!data) {
          console.log('[ClubCurrentMatch] No active match found');
          setMatch(undefined);
          setIsLoading(false);
          return;
        }

        console.log('[ClubCurrentMatch] Raw match data:', data);

        // Parse members data
        const parseMembers = (membersJson: any) => {
          if (!membersJson) return [];
          
          try {
            const parsedMembers = typeof membersJson === 'string' 
              ? JSON.parse(membersJson) 
              : membersJson;
              
            const membersArray = Array.isArray(parsedMembers) 
              ? parsedMembers 
              : Object.values(parsedMembers);
            
            return membersArray.map((member: any) => ({
              id: member.user_id,
              name: member.name || 'Unknown',
              avatar: member.avatar || '/placeholder.svg',
              isAdmin: member.is_admin || false,
              distanceContribution: parseFloat(String(member.distance || '0'))
            }));
          } catch (error) {
            console.error('[ClubCurrentMatch] Error parsing members JSON:', error);
            return [];
          }
        };

        const homeMembers = parseMembers(data.home_club_members);
        const awayMembers = parseMembers(data.away_club_members);
        
        const homeTotalDistance = data.home_total_distance !== null ? 
          parseFloat(String(data.home_total_distance)) : 
          homeMembers.reduce((sum, member) => sum + (member.distanceContribution || 0), 0);
          
        const awayTotalDistance = data.away_total_distance !== null ? 
          parseFloat(String(data.away_total_distance)) : 
          awayMembers.reduce((sum, member) => sum + (member.distanceContribution || 0), 0);

        const parsedMatch: Match = {
          id: data.match_id,
          homeClub: {
            id: data.home_club_id,
            name: data.home_club_name || "Unknown Team",
            logo: data.home_club_logo || '/placeholder.svg',
            division: ensureDivision(data.home_club_division),
            tier: Number(data.home_club_tier || 1),
            totalDistance: homeTotalDistance,
            members: homeMembers
          },
          awayClub: {
            id: data.away_club_id,
            name: data.away_club_name || "Unknown Team", 
            logo: data.away_club_logo || '/placeholder.svg',
            division: ensureDivision(data.away_club_division),
            tier: Number(data.away_club_tier || 1),
            totalDistance: awayTotalDistance,
            members: awayMembers
          },
          startDate: data.start_date,
          endDate: data.end_date,
          status: data.status as 'active' | 'completed',
          winner: data.winner as 'home' | 'away' | 'draw' | undefined
        };
        
        console.log('[ClubCurrentMatch] Processed match data:', parsedMatch);
        setMatch(parsedMatch);
      } catch (error) {
        console.error('[ClubCurrentMatch] Error:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchActiveMatch();
    
    // Set up realtime subscription for match updates
    const channel = supabase
      .channel('club-current-match-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'matches'
        },
        () => {
          console.log('[ClubCurrentMatch] Realtime update detected for matches');
          fetchActiveMatch();
        }
      )
      .subscribe();
      
    // Set up Supabase realtime subscription for match_distances table
    const distancesChannel = supabase
      .channel('club-current-match-distances-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'match_distances'
        },
        () => {
          console.log('[ClubCurrentMatch] Realtime update detected for distances');
          fetchActiveMatch();
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(distancesChannel);
    };
  }, [clubId, selectedClub?.id]);

  console.log('[ClubCurrentMatch] Rendering with match data:', {
    matchId: match?.id,
    homeClub: match?.homeClub,
    awayClub: match?.awayClub,
    status: match?.status,
    forceShowDetails,
    isLoading
  });
  
  // No match and no selected club means we can't show anything
  if (!selectedClub) {
    console.error('[ClubCurrentMatch] Missing selectedClub data');
    return (
      <Card className="shadow-sm">
        <CardContent className="p-4">
          <div className="text-center py-4 text-gray-500">
            Match data is unavailable
          </div>
        </CardContent>
      </Card>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <Card className="shadow-sm">
        <CardContent className="p-4">
          <div className="text-center py-4">
            <div className="h-40 bg-gray-100 animate-pulse rounded-md"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // If no match but we have a club, show the appropriate state (search button or need more members)
  if (!match && selectedClub) {
    const hasEnoughMembers = selectedClub.members && selectedClub.members.length >= 5;

    if (hasEnoughMembers) {
      return (
        <Card className="shadow-md">
          <CardContent className="p-4">
            <div className="bg-blue-50 p-3 rounded-md text-center my-3">
              <p className="font-medium mb-3">Ready to compete</p>
              <SearchOpponentButton club={selectedClub} />
            </div>
          </CardContent>
        </Card>
      );
    } else {
      return <NeedMoreMembersCard club={selectedClub} hideHeader={true} />;
    }
  }
  
  // We have a match, use CurrentMatchCard which uses the shared MatchDisplay component
  if (match && selectedClub) {
    console.log('[ClubCurrentMatch] Rendering match with club data:', {
      matchId: match.id,
      clubId: selectedClub.id,
      forceShowDetails: true
    });
    
    // Always force details to be shown on club detail view
    return (
      <CurrentMatchCard
        match={match} 
        userClub={selectedClub} 
        onViewProfile={onViewProfile} 
        forceShowDetails={true}
      />
    );
  }
  
  // Fallback case - should not reach here
  return (
    <Card className="shadow-sm">
      <CardContent className="p-4">
        <div className="text-center py-4 text-gray-500">
          Unable to render match information
        </div>
      </CardContent>
    </Card>
  );
};

export default ClubCurrentMatch;
