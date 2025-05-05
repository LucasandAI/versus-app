
import React, { useState, useEffect } from 'react';
import { Club, Match } from '@/types';
import ClubCurrentMatch from '../club/detail/ClubCurrentMatch';
import WaitingForMatchCard from './WaitingForMatchCard';
import NeedMoreMembersCard from './NeedMoreMembersCard';
import { isActiveMatchWeek, getCurrentCycleInfo } from '@/utils/date/matchTiming';
import { supabase } from '@/integrations/supabase/client';

interface CurrentMatchesListProps {
  userClubs: Club[];
  onViewProfile: (userId: string, name: string, avatar?: string) => void;
}

const CurrentMatchesList: React.FC<CurrentMatchesListProps> = ({
  userClubs: initialClubs,
  onViewProfile
}) => {
  const [userClubs, setUserClubs] = useState<Club[]>(initialClubs);
  const [cycleInfo, setCycleInfo] = useState(getCurrentCycleInfo());
  
  // Helper function to check if a club has an active match
  const getActiveMatch = (club: Club): Match | null => {
    return club.currentMatch || 
           (club.matchHistory && club.matchHistory.find(m => m.status === 'active')) ||
           null;
  };

  useEffect(() => {
    // Update clubs when initial data changes
    setUserClubs(initialClubs);
    
    // Update cycle info periodically
    const cycleTimer = setInterval(() => {
      const newCycleInfo = getCurrentCycleInfo();
      setCycleInfo(newCycleInfo);
    }, 1000);
    
    // Set up real-time listeners for match updates
    const channels = initialClubs.map(club => {
      // Subscribe to match changes for this club
      return supabase
        .channel(`club-matches-${club.id}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'matches',
            filter: `home_club_id=eq.${club.id},away_club_id=eq.${club.id}`
          },
          (payload) => {
            console.log(`[CurrentMatchesList] Match changed for club ${club.id}:`, payload);
            window.dispatchEvent(new CustomEvent('matchUpdated', { detail: { clubId: club.id } }));
          }
        )
        .subscribe();
    });

    // Listen for match data update events
    const handleMatchUpdate = () => {
      console.log('[CurrentMatchesList] Match updated event received');
      setUserClubs(initialClubs);
    };
    
    // Listen for member data update events
    const handleMembershipChange = () => {
      console.log('[CurrentMatchesList] Club membership changed event received');
      setUserClubs(initialClubs);
    };

    window.addEventListener('matchUpdated', handleMatchUpdate as EventListener);
    window.addEventListener('clubMembershipChanged', handleMembershipChange as EventListener);
    window.addEventListener('userDataUpdated', () => setUserClubs(initialClubs));
    window.addEventListener('newMatchWeekStarted', handleMatchUpdate as EventListener);
    
    // Clean up subscriptions
    return () => {
      clearInterval(cycleTimer);
      channels.forEach(channel => supabase.removeChannel(channel));
      window.removeEventListener('matchUpdated', handleMatchUpdate as EventListener);
      window.removeEventListener('clubMembershipChanged', handleMembershipChange as EventListener);
      window.removeEventListener('userDataUpdated', () => setUserClubs(initialClubs));
      window.removeEventListener('newMatchWeekStarted', handleMatchUpdate as EventListener);
    };
  }, [initialClubs]);

  if (!userClubs || userClubs.length === 0) {
    return (
      <div className="text-center p-4 bg-gray-50 rounded-lg">
        <p className="text-gray-500">You haven't joined any clubs yet.</p>
      </div>
    );
  }

  return (
    <div>
      {userClubs.map(club => {
        // Check for active matches
        const activeMatch = getActiveMatch(club);
        const hasEnoughMembers = club.members.length >= 5;
        
        if (activeMatch) {
          console.log(`[CurrentMatchesList] Rendering active match for club: ${club.name}`);
          return (
            <div key={`${club.id}-match`} className="mb-6 bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="p-4 border-b border-gray-100">
                <h3 className="font-bold text-md">{club.name}</h3>
              </div>
              <div className="p-4">
                <ClubCurrentMatch 
                  match={activeMatch}
                  onViewProfile={onViewProfile}
                />
              </div>
            </div>
          );
        } else if (hasEnoughMembers) {
          return <WaitingForMatchCard key={`${club.id}-waiting`} club={club} />;
        } else {
          return <NeedMoreMembersCard key={`${club.id}-needs-members`} club={club} />;
        }
      })}
    </div>
  );
};

export default CurrentMatchesList;
