
import React, { useState, useEffect, useCallback } from 'react';
import { Club } from '@/types';
import FindClubsSection from './FindClubsSection';
import { useApp } from '@/context/AppContext';
import CurrentMatchesList from '../match/CurrentMatchesList';
import { supabase } from '@/integrations/supabase/client';
import { transformRawMatchesToMatchType } from '@/utils/club/matchHistoryUtils';
import { ensureMemberDistances } from '@/utils/club/memberDistanceUtils';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

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
          // Fetch club details (name, logo)
          const { data: clubDetails, error: clubError } = await supabase
            .from('clubs')
            .select('name, logo')
            .eq('id', club.id)
            .single();
            
          if (clubError) {
            console.error(`[HomeClubsSection] Error fetching club details for club ${club.id}:`, clubError);
          }

          // Fetch club members
          const { data: membersData, error: membersError } = await supabase
            .from('club_members')
            .select(`
              user_id,
              users:user_id (
                id,
                name,
                avatar
              ),
              is_admin
            `)
            .eq('club_id', club.id);
            
          if (membersError) {
            console.error(`[HomeClubsSection] Error fetching members for club ${club.id}:`, membersError);
          }
          
          // Process members data with default 0 km contribution
          const processedMembers = (membersData || []).map(member => ({
            id: member.user_id,
            name: member.users?.name || 'Unknown',
            avatar: member.users?.avatar || '/placeholder.svg',
            isAdmin: member.is_admin,
            distanceContribution: 0 // Default contribution is 0 km
          }));

          // Fetch match history for the club
          const { data: matchHistory, error: matchError } = await supabase
            .from('matches')
            .select('*')
            .or(`home_club_id.eq.${club.id},away_club_id.eq.${club.id}`)
            .order('end_date', { ascending: false });
            
          if (matchError) {
            console.error(`[HomeClubsSection] Error fetching matches for club ${club.id}:`, matchError);
            return {
              ...club,
              name: clubDetails?.name || club.name,
              logo: clubDetails?.logo || club.logo,
              members: ensureMemberDistances(processedMembers)
            };
          }
          
          // Transform raw match data into Match type
          const transformedMatches = transformRawMatchesToMatchType(matchHistory || [], club.id);
          
          // Find current active match
          const currentMatch = transformedMatches.find(m => m.status === 'active') || null;
          
          // Return hydrated club with properly transformed data
          return {
            ...club,
            name: clubDetails?.name || club.name,
            logo: clubDetails?.logo || club.logo,
            members: ensureMemberDistances(processedMembers),
            matchHistory: transformedMatches,
            currentMatch: currentMatch
          };
        })
      );
      
      console.log('[HomeClubsSection] Hydrated clubs with match data:', hydratedClubs);
      setUserClubs(hydratedClubs);
    } catch (error) {
      console.error('[HomeClubsSection] Error hydrating clubs with match data:', error);
    } finally {
      setIsLoading(false);
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
      // We shouldn't directly set userClubs to initialUserClubs here
      // because initialUserClubs might not have properly formatted matchHistory
      // Instead, trigger the hydration process
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
  }, [currentUser, initialUserClubs, initialAvailableClubs, hydrateClubsWithMatchData]);
  
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

  const handleClubClick = (club: Club) => {
    onSelectClub(club);
  };

  // Club card component for clickable clubs
  const ClubCard = ({ club }: { club: Club }) => (
    <Card 
      className="cursor-pointer hover:shadow-md transition-shadow mb-4"
      onClick={() => handleClubClick(club)}
    >
      <CardContent className="p-4 flex items-center">
        <div className="h-12 w-12 rounded-full overflow-hidden mr-4">
          <img 
            src={club.logo || '/placeholder.svg'} 
            alt={`${club.name} logo`}
            className="h-full w-full object-cover"
          />
        </div>
        <div>
          <h3 className="font-medium text-lg">{club.name || 'Unnamed Club'}</h3>
          <p className="text-sm text-gray-500">
            {club.members?.length || 0} members
          </p>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <>
      <h2 className="text-xl font-bold mt-6 mb-4">Your Clubs</h2>
      
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(2)].map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : processedUserClubs.length > 0 ? (
        <div className="space-y-2 mb-6">
          {processedUserClubs.map(club => (
            <ClubCard key={club.id} club={club} />
          ))}
        </div>
      ) : (
        <div className="text-center p-4 bg-gray-50 rounded-lg mb-6">
          <p className="text-gray-500">You haven't joined any clubs yet.</p>
        </div>
      )}

      <h2 className="text-xl font-bold mt-6 mb-4">Current Matches</h2>
      
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(2)].map((_, i) => (
            <Skeleton key={i} className="h-40 w-full" />
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
