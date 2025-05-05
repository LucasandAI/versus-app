import React, { useState, useEffect } from 'react';
import { Club } from '@/types';
import FindClubsSection from './FindClubsSection';
import { useApp } from '@/context/AppContext';
import CurrentMatchesList from '../match/CurrentMatchesList';
import { supabase } from '@/integrations/supabase/client';

interface HomeClubsSectionProps {
  userClubs: Club[];
  availableClubs: any[];
  clubsLoading?: boolean;
  onSelectClub: (club: Club) => void;
  onSelectUser: (userId: string, name: string, avatar?: string) => void;
  onCreateClub: () => void;
  onRequestJoin: (clubId: string, clubName: string) => void;
  onSearchClick: () => void;
}

const HomeClubsSection: React.FC<HomeClubsSectionProps> = ({
  userClubs: initialUserClubs,
  availableClubs: initialAvailableClubs,
  clubsLoading = false,
  onSelectClub,
  onSelectUser,
  onCreateClub,
  onRequestJoin,
  onSearchClick
}) => {
  const { currentUser } = useApp();
  const [isLoading, setIsLoading] = useState(true);
  const [userClubs, setUserClubs] = useState<Club[]>(initialUserClubs);
  const [availableClubs, setAvailableClubs] = useState<any[]>(initialAvailableClubs);
  
  // Track loading state based on initial render and clubs data quality
  useEffect(() => {
    // Update clubs when props change
    setUserClubs(initialUserClubs);
    setAvailableClubs(initialAvailableClubs);
    
    // Define what makes a club "fully loaded"
    const areClubsReady = initialUserClubs.every(club => 
      club && 
      club.name && 
      club.logo && 
      club.members && 
      Array.isArray(club.members)
    );
    
    // If we have the user but clubs are loading/incomplete, show loading state
    if (currentUser) {
      if (clubsLoading || !areClubsReady) {
        setIsLoading(true);
      } else {
        // Add a small delay to ensure everything renders correctly
        const timer = setTimeout(() => {
          setIsLoading(false);
        }, 100);
        
        return () => clearTimeout(timer);
      }
    } else {
      setIsLoading(true);
    }
  }, [currentUser, initialUserClubs, initialAvailableClubs, clubsLoading]);

  // Set up real-time subscriptions for club data
  useEffect(() => {
    if (!currentUser) return;
    
    // Global subscription to user's club memberships
    const membershipChannel = supabase
      .channel('user-club-memberships')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'club_members',
          filter: `user_id=eq.${currentUser.id}`
        },
        (payload) => {
          console.log('[HomeClubsSection] User club membership changed:', payload);
          window.dispatchEvent(new CustomEvent('userClubMembershipChanged'));
        }
      )
      .subscribe();

    // Global subscription to club updates  
    const clubsChannel = supabase
      .channel('club-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'clubs'
        },
        (payload) => {
          console.log('[HomeClubsSection] Club data updated:', payload);
          window.dispatchEvent(new CustomEvent('clubDataUpdated'));
        }
      )
      .subscribe();
      
    // Event handlers for global events
    const handleDataUpdate = () => {
      console.log('[HomeClubsSection] Data update event received, updating clubs');
      setUserClubs(initialUserClubs);
      setAvailableClubs(initialAvailableClubs);
    };
    
    window.addEventListener('userDataUpdated', handleDataUpdate);
    window.addEventListener('clubDataUpdated', handleDataUpdate);
    window.addEventListener('userClubMembershipChanged', handleDataUpdate);
    window.addEventListener('matchUpdated', handleDataUpdate);
    window.addEventListener('matchCreated', handleDataUpdate);
    window.addEventListener('matchEnded', handleDataUpdate);
    window.addEventListener('newMatchWeekStarted', handleDataUpdate);
    
    return () => {
      supabase.removeChannel(membershipChannel);
      supabase.removeChannel(clubsChannel);
      window.removeEventListener('userDataUpdated', handleDataUpdate);
      window.removeEventListener('clubDataUpdated', handleDataUpdate);
      window.removeEventListener('userClubMembershipChanged', handleDataUpdate);
      window.removeEventListener('matchUpdated', handleDataUpdate);
      window.removeEventListener('matchCreated', handleDataUpdate);
      window.removeEventListener('matchEnded', handleDataUpdate);
      window.removeEventListener('newMatchWeekStarted', handleDataUpdate);
    };
  }, [currentUser, initialUserClubs, initialAvailableClubs]);
  
  // Process clubs to ensure they have the necessary properties
  const processedUserClubs = userClubs
    .filter(club => club && club.name) // Only include clubs with name
    .map(club => ({
      ...club,
      // Ensure the members array exists
      members: club.members || []
    }));

  console.log('[HomeClubsSection] Processed clubs with match data:', processedUserClubs.map(club => ({
    id: club.id,
    name: club.name,
    hasCurrentMatch: !!club.currentMatch,
    currentMatch: club.currentMatch
  })));

  const isAtClubCapacity = processedUserClubs.length >= 3;

  return (
    <>
      <h2 className="text-xl font-bold mt-6 mb-4">Current Matches</h2>
      
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="h-40 bg-gray-100 animate-pulse rounded-md"></div>
          ))}
        </div>
      ) : (
        <CurrentMatchesList 
          userClubs={processedUserClubs}
          onViewProfile={onSelectUser}
        />
      )}

      {!isAtClubCapacity && !isLoading && (
        <FindClubsSection 
          clubs={availableClubs}
          isLoading={clubsLoading}
          onRequestJoin={onRequestJoin}
          onSearchClick={onSearchClick}
          onCreateClick={onCreateClub}
        />
      )}

      {isAtClubCapacity && !isLoading && (
        <div className="mt-10 bg-white rounded-lg shadow-md p-6 text-center">
          <h3 className="font-medium mb-2">Club Limit Reached</h3>
          <p className="text-gray-500 text-sm mb-4">
            You have reached the maximum of 3 clubs.
          </p>
        </div>
      )}
    </>
  );
};

export default HomeClubsSection;
