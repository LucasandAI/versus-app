
import { useApp } from '@/context/AppContext';
import { User, Club, ClubMember } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { useState } from 'react';
import { toast } from '@/hooks/use-toast';

export const useNavigation = () => {
  const { setCurrentView, setSelectedClub, setSelectedUser, currentUser } = useApp();
  const [isLoading, setIsLoading] = useState(false);

  const navigateToUserProfile = async (userId: string, userName: string, userAvatar: string = '/placeholder.svg') => {
    setIsLoading(true);
    
    try {
      // Create a temporary user object with basic info while we load data
      const tempUser: User = {
        id: userId,
        name: userName,
        avatar: userAvatar,
        stravaConnected: true,
        clubs: []
      };
      
      setSelectedUser(tempUser);
      setCurrentView('profile');
      
      // Attempt to fetch user profile data from Supabase
      const { data: userData, error } = await supabase
        .from('users')
        .select('*, clubs:clubs_members(club:clubs(*))')
        .eq('id', userId)
        .single();
        
      if (error) {
        console.error('Error fetching user profile:', error);
        
        // Fallback to local data if Supabase query fails
        if (currentUser) {
          // Find all clubs where this user is a member
          const userClubs: Club[] = [];
          
          currentUser.clubs.forEach(club => {
            const isMember = club.members.some(member => member.id === userId);
            
            if (isMember) {
              // Find the member object to get their admin status
              const memberData = club.members.find(member => member.id === userId);
              
              // Add this club to the user's clubs list
              userClubs.push({
                ...club,
                // Update members list to reflect the correct admin status for this user
                members: club.members.map(member => {
                  if (member.id === userId) {
                    return {
                      ...member,
                      name: userName,
                      avatar: userAvatar,
                      isAdmin: memberData?.isAdmin || false
                    };
                  }
                  return member;
                })
              });
            }
          });
          
          // Update the user with club data
          setSelectedUser({
            ...tempUser,
            clubs: userClubs
          });
        }
      } else if (userData) {
        // Transform the Supabase data to match our User type
        const transformedUser: User = {
          id: userData.id,
          name: userData.name || userName,
          avatar: userData.avatar_url || userAvatar,
          stravaConnected: Boolean(userData.strava_connected),
          bio: userData.bio,
          clubs: userData.clubs?.map((clubData: any) => ({
            id: clubData.club.id,
            name: clubData.club.name,
            logo: clubData.club.logo_url,
            division: clubData.club.division,
            tier: clubData.club.tier,
            elitePoints: clubData.club.elite_points,
            members: clubData.club.members || [],
            matchHistory: clubData.club.match_history || []
          })) || []
        };
        
        setSelectedUser(transformedUser);
      }
    } catch (error) {
      console.error('Error in navigateToUserProfile:', error);
      toast({
        title: "Error loading profile",
        description: "Could not load complete profile data",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const navigateToClubDetail = (clubId: string, club: any) => {
    setSelectedClub(club);
    setCurrentView('clubDetail');
  };

  return {
    navigateToUserProfile,
    navigateToClubDetail,
    isLoading
  };
};
