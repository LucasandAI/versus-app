
import { useUserNavigation } from './navigation/useUserNavigation';
import { useClubNavigation } from './navigation/useClubNavigation';
import { Club } from '@/types';
import { useApp } from '@/context/AppContext';
import { supabase } from '@/integrations/supabase/client';
import { ensureDivision } from '@/utils/club/leagueUtils';

export const useNavigation = () => {
  const { navigateToUserProfile, isLoading: userNavLoading } = useUserNavigation();
  const { navigateToClub } = useClubNavigation();
  const { currentUser, setCurrentView, setSelectedUser, setSelectedClub } = useApp();
  
  // Improved navigation to club with full data fetching
  const navigateToClubDetail = async (clubId: string, clubData?: Partial<Club>) => {
    if (!clubId) {
      console.error('[useNavigation] Cannot navigate to club detail, missing club ID');
      return;
    }
    
    console.log('[useNavigation] Navigating to club detail:', clubId, clubData);
    
    // Check if we already have this club in currentUser.clubs
    const userClub = currentUser?.clubs?.find(c => c.id === clubId);
    
    if (userClub) {
      // User is already a member - use the complete data from context
      console.log('[useNavigation] User is a member, using club from context:', userClub);
      setSelectedClub(userClub);
      setCurrentView('clubDetail');
      return;
    }
    
    // User is not a member - need to fetch full club data
    console.log('[useNavigation] User is not a member, fetching full club data');
    
    // Set a temporary club object for immediate feedback
    const tempClub: Partial<Club> = {
      id: clubId,
      name: clubData?.name || 'Loading...',
      logo: clubData?.logo || '/placeholder.svg',
      division: clubData?.division || 'bronze',
      tier: clubData?.tier || 5,
      elitePoints: clubData?.elitePoints || 0,
      members: [],
      matchHistory: []
    };
    
    setSelectedClub(tempClub as Club);
    
    try {
      // Fetch club details
      const { data: clubDetails, error: clubError } = await supabase
        .from('clubs')
        .select('id, name, logo, division, tier, elite_points, bio, created_by')
        .eq('id', clubId)
        .single();
      
      if (clubError) {
        console.error('[useNavigation] Error fetching club details:', clubError);
        // Navigate anyway with what we have
        setCurrentView('clubDetail');
        return;
      }
      
      // Fetch members
      const { data: membersData, error: membersError } = await supabase
        .from('club_members')
        .select('user_id, is_admin')
        .eq('club_id', clubId);
      
      if (membersError) {
        console.error('[useNavigation] Error fetching club members:', membersError);
      }
      
      // If we have members, fetch their user details
      let members: any[] = [];
      if (membersData && membersData.length > 0) {
        const userIds = membersData.map(m => m.user_id);
        
        const { data: usersData } = await supabase
          .from('users')
          .select('id, name, avatar')
          .in('id', userIds);
          
        if (usersData) {
          // Map users to members with admin status
          members = usersData.map(user => {
            const memberData = membersData.find(m => m.user_id === user.id);
            return {
              id: user.id,
              name: user.name,
              avatar: user.avatar,
              isAdmin: memberData?.is_admin || false,
              distanceContribution: 0
            };
          });
        }
      }
      
      // Fetch match history
      const { data: matchesData } = await supabase
        .from('matches')
        .select('*')
        .or(`home_club_id.eq.${clubId},away_club_id.eq.${clubId}`)
        .order('end_date', { ascending: false });
      
      // Process match data
      const matchHistory = matchesData ? matchesData.map(match => {
        return {
          id: match.id,
          homeClub: {
            id: match.home_club_id,
            name: 'Home Club', // Will be populated by the club detail page
            logo: '/placeholder.svg', // Placeholder until we get actual data
            totalDistance: 0,
            members: [] // Empty array to satisfy TypeScript
          },
          awayClub: {
            id: match.away_club_id,
            name: 'Away Club', // Will be populated by the club detail page
            logo: '/placeholder.svg', // Placeholder until we get actual data
            totalDistance: 0,
            members: [] // Empty array to satisfy TypeScript
          },
          startDate: match.start_date,
          endDate: match.end_date,
          status: match.status as 'active' | 'completed',
          winner: match.winner as 'home' | 'away' | 'draw' | undefined
        };
      }) : [];
      
      // Now create a fully hydrated club object
      const fullClub: Club = {
        id: clubDetails.id,
        name: clubDetails.name || 'Unnamed Club',
        logo: clubDetails.logo || '/placeholder.svg',
        division: ensureDivision(clubDetails.division),
        tier: clubDetails.tier || 5,
        elitePoints: clubDetails.elite_points || 0,
        bio: clubDetails.bio || '',
        createdBy: clubDetails.created_by,
        members: members,
        matchHistory: matchHistory,
        currentMatch: matchHistory.find(m => m.status === 'active') || null
      };
      
      console.log('[useNavigation] Successfully fetched full club data:', fullClub);
      
      // Update the selected club with complete data
      setSelectedClub(fullClub);
      
      // Then navigate
      setCurrentView('clubDetail');
      
    } catch (error) {
      console.error('[useNavigation] Error during club data fetching:', error);
      // Navigate anyway with what we have
      setCurrentView('clubDetail');
    }
  };
  
  // Convenience method to navigate to your own profile
  const navigateToOwnProfile = () => {
    if (currentUser) {
      setSelectedUser(currentUser);
      setCurrentView('profile');
    }
  };
  
  return {
    navigateToUserProfile,
    navigateToClubDetail,
    navigateToClub,
    navigateToOwnProfile,
    isLoading: userNavLoading || false
  };
};
