
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Club } from '@/types';
import { getNextMatchStart } from '@/utils/date/matchTiming';
import CountdownTimer from './CountdownTimer';
import { formatLeague } from '@/utils/club/leagueUtils';
import UserAvatar from '@/components/shared/UserAvatar';
import { useNavigation } from '@/hooks/useNavigation';
import { supabase } from '@/integrations/supabase/client';

interface WaitingForMatchCardProps {
  club: Club;
}

const WaitingForMatchCard: React.FC<WaitingForMatchCardProps> = ({ club: initialClub }) => {
  const [club, setClub] = useState(initialClub);
  const [nextMatchStart] = useState(getNextMatchStart()); // Store in state to prevent recomputing on re-render
  const { navigateToClubDetail } = useNavigation();
  
  const handleClubClick = () => {
    navigateToClubDetail(club.id, club);
  };
  
  // Set up real-time subscription to club member and match changes
  useEffect(() => {
    // Update club data when the prop changes
    setClub(initialClub);

    // Listen for match creation for this club
    const matchChannel = supabase
      .channel(`club-matches-creation-${club.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'matches',
          filter: `home_club_id=eq.${club.id},away_club_id=eq.${club.id}`
        },
        (payload) => {
          console.log(`[WaitingForMatchCard] New match created for ${club.id}:`, payload);
          window.dispatchEvent(new CustomEvent('matchCreated', { 
            detail: { clubId: club.id } 
          }));
        }
      )
      .subscribe();
      
    // Listen for match creation events
    const handleMatchCreate = (event: CustomEvent) => {
      if (event.detail?.clubId === club.id) {
        console.log(`[WaitingForMatchCard] Match created for ${club.id}, refreshing...`);
      }
    };
    
    // Listen for countdown completion (new match week)
    const handleNewMatchWeek = () => {
      console.log('[WaitingForMatchCard] New match week started, refreshing data');
      window.dispatchEvent(new CustomEvent('newMatchWeekStarted'));
    };
    
    window.addEventListener('matchCreated', handleMatchCreate as EventListener);
    window.addEventListener('userDataUpdated', () => setClub(initialClub));
    
    return () => {
      supabase.removeChannel(matchChannel);
      window.removeEventListener('matchCreated', handleMatchCreate as EventListener);
      window.removeEventListener('userDataUpdated', () => setClub(initialClub));
    };
  }, [club.id, initialClub]);

  const handleCountdownComplete = () => {
    console.log('[WaitingForMatchCard] Countdown complete, new match week starting');
    // Trigger match creation by dispatching a global event
    window.dispatchEvent(new CustomEvent('newMatchWeekStarted'));
    
    // Use fetch to trigger match creation for this club
    // This ensures the backend knows it's time to create a match for this club
    fetch(`/api/matches/create?clubId=${club.id}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    }).catch(err => {
      console.error('[WaitingForMatchCard] Error triggering match creation:', err);
    });
  };
  
  return (
    <Card className="mb-4 overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-center">
          <UserAvatar 
            name={club.name} 
            image={club.logo} 
            size="md"
            className="mr-3 cursor-pointer"
            onClick={handleClubClick}
          />
          <div>
            <h3 
              className="font-medium cursor-pointer hover:text-primary transition-colors"
              onClick={handleClubClick}
            >
              {club.name}
            </h3>
            <div className="flex items-center gap-1 mt-0.5">
              <span className="text-xs bg-gray-100 px-2 py-0.5 rounded text-gray-600">
                {formatLeague(club.division, club.tier)}
              </span>
              <span className="text-xs text-gray-500">
                • {club.members.length}/5 members
              </span>
            </div>
          </div>
        </div>
        
        <div className="mt-4 p-3 bg-amber-50 rounded-md">
          <p className="text-sm mb-1">Next match starting soon...</p>
          <div className="flex items-center">
            <span className="text-xs text-gray-500 mr-2">Countdown:</span>
            <CountdownTimer 
              targetDate={nextMatchStart} 
              className="text-sm font-medium text-amber-700"
              onComplete={handleCountdownComplete}
              refreshInterval={500} // Update every half second
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default WaitingForMatchCard;
