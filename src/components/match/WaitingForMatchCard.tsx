
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Club } from '@/types';
import { getCurrentCycleInfo } from '@/utils/date/matchTiming';
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
  const { navigateToClubDetail } = useNavigation();
  const [cycleInfo, setCycleInfo] = useState(getCurrentCycleInfo());
  
  const handleClubClick = () => {
    navigateToClubDetail(club.id, club);
  };
  
  // Set up real-time subscription to club member and match changes
  useEffect(() => {
    // Update club data when the prop changes
    setClub(initialClub);
    
    // Update cycle info periodically
    const cycleTimer = setInterval(() => {
      setCycleInfo(getCurrentCycleInfo());
    }, 1000);

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
      clearInterval(cycleTimer);
      supabase.removeChannel(matchChannel);
      window.removeEventListener('matchCreated', handleMatchCreate as EventListener);
      window.removeEventListener('userDataUpdated', () => setClub(initialClub));
    };
  }, [club.id, initialClub]);

  // Only trigger match creation at the start of a new cycle (match phase)
  // This should only happen during the transition from cooldown to match phase
  const handleCountdownComplete = () => {
    // Only create a match if we're at the start of a new cycle (match phase)
    const latestCycleInfo = getCurrentCycleInfo();
    
    // Only trigger match creation if we're transitioning to a match phase
    if (!latestCycleInfo.isInMatchPhase) {
      return; // Don't create matches during cooldown
    }
    
    console.log('[WaitingForMatchCard] New match cycle starting, creating match');
    window.dispatchEvent(new CustomEvent('newMatchWeekStarted'));
    
    // Use fetch to trigger match creation for this club
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
  
  // Determine the appropriate status message based on cycle phase
  const getStatusMessage = () => {
    if (cycleInfo.isInMatchPhase) {
      return "Match in progress...";
    } else {
      return "Next match starting soon...";
    }
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
        
        <div className={`mt-4 p-3 rounded-md ${cycleInfo.isInMatchPhase ? 'bg-amber-50' : 'bg-blue-50'}`}>
          <p className="text-sm mb-1">{getStatusMessage()}</p>
          <div className="flex items-center">
            <CountdownTimer 
              useCurrentCycle={true}
              showPhaseLabel={true}
              className={`text-sm font-medium ${cycleInfo.isInMatchPhase ? 'text-amber-700' : 'text-blue-700'}`}
              onComplete={handleCountdownComplete}
              refreshInterval={500}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default WaitingForMatchCard;
