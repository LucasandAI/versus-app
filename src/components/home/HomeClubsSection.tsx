import React, { useState, useEffect, useCallback } from 'react';
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
  
  // Define the hydration function outside useEffect so it can be used by multiple hooks
  const hydrateClubsWithMatchData = useCallback(async () => {
    if (!initialUserClubs.length) return;
    
    try {
      const hydratedClubs = await Promise.all(
        initialUserClubs.map(async (club) => {
          // Fetch match history for the club
          const { data: matchHistory, error: matchError } = await supabase
            .from('matches')
            .select('*')
            .or(`home_club_id.eq.${club.id},away_club_id.eq.${club.id}`)
            .order('end_date', { ascending: false });
            
          if (matchError) {
            console.error(`[HomeClubsSection] Error fetching matches for club ${club.id}:`, matchError);
            return club;
          }
          
          // Find current active match
          const currentMatch = matchHistory?.find(m => m.status === 'active') || null;
          
          // Return hydrated club
          return {
            ...club,
            matchHistory: matchHistory || [],
            currentMatch: currentMatch
          };
        })
      );
      
      console.log('[HomeClubsSection] Hydrated clubs with match data:', hydratedClubs);
      setUserClubs(hydratedClubs);
    } catch (error) {
      console.error('[HomeClubsSection] Error hydrating clubs with match data:', error);
    }
  }, [initialUserClubs]);

  // Initial hydration
  useEffect(() => {
    hydrateClubsWithMatchData();
  }, [hydrateClubsWithMatchData]);
  
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

    // Set up match subscriptions for each club
    const matchChannels = initialUserClubs.map(club => 
      supabase
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
            console.log(`[HomeClubsSection] Match changed for club ${club.id}:`, payload);
            // Trigger a refresh of the hydrated clubs
            hydrateClubsWithMatchData();
          }
        )
        .subscribe()
    );
      
    // Event handlers for global events
    const handleDataUpdate = () => {
      console.log('[HomeClubsSection] Data update event received, updating clubs');
      setUserClubs(initialUserClubs);
      setAvailableClubs(initialAvailableClubs);
      // Also refresh match data when other data changes
      hydrateClubsWithMatchData();
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
      matchChannels.forEach(channel => supabase.removeChannel(channel));
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
