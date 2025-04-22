
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
        .select('id, name, avatar_url, strava_connected, bio')
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
        // Fetch user's clubs from Supabase
        const { data: userClubsData, error: clubsError } = await supabase
          .from('clubs_members')
          .select('club_id, is_admin, distance_contribution, club:clubs(id, name, logo_url, division, tier, elite_points)')
          .eq('user_id', userId);
          
        if (clubsError) {
          console.error('Error fetching user clubs:', clubsError);
        }
        
        // Transform the user clubs data
        const clubs: Club[] = [];
        
        if (userClubsData && userClubsData.length > 0) {
          for (const clubData of userClubsData) {
            // Fetch club members
            const { data: membersData, error: membersError } = await supabase
              .from('clubs_members')
              .select('user_id, is_admin, distance_contribution, user:users(id, name, avatar_url)')
              .eq('club_id', clubData.club.id);
              
            if (membersError) {
              console.error('Error fetching club members:', membersError);
              continue;
            }
            
            // Transform members data
            const members: ClubMember[] = membersData.map(member => ({
              id: member.user.id,
              name: member.user.name,
              avatar: member.user.avatar_url || '/placeholder.svg',
              isAdmin: member.is_admin,
              distanceContribution: member.distance_contribution
            }));
            
            // Fetch match history
            const { data: matchHistory, error: matchError } = await supabase
              .from('matches')
              .select('*')
              .or(`home_club_id.eq.${clubData.club.id},away_club_id.eq.${clubData.club.id}`)
              .order('end_date', { ascending: false });
              
            if (matchError) {
              console.error('Error fetching match history:', matchError);
            }
            
            // Transform club data
            clubs.push({
              id: clubData.club.id,
              name: clubData.club.name,
              logo: clubData.club.logo_url || '/placeholder.svg',
              division: clubData.club.division,
              tier: clubData.club.tier || 1,
              elitePoints: clubData.club.elite_points,
              members: members,
              matchHistory: matchHistory || []
            });
          }
        }
        
        // Update the selected user with the transformed data
        setSelectedUser({
          id: userData.id,
          name: userData.name || userName,
          avatar: userData.avatar_url || userAvatar,
          stravaConnected: Boolean(userData.strava_connected),
          bio: userData.bio,
          clubs: clubs
        });
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

  const navigateToClubDetail = async (clubId: string, club?: any) => {
    setIsLoading(true);
    
    try {
      // Create a temporary club object with basic info while we load data
      if (club) {
        setSelectedClub(club);
        setCurrentView('clubDetail');
      }
      
      // Fetch club data from Supabase
      const { data: clubData, error } = await supabase
        .from('clubs')
        .select('id, name, logo_url, division, tier, elite_points, bio')
        .eq('id', clubId)
        .single();
        
      if (error) {
        console.error('Error fetching club:', error);
        return;
      }
      
      // Fetch club members
      const { data: membersData, error: membersError } = await supabase
        .from('clubs_members')
        .select('user_id, is_admin, distance_contribution, user:users(id, name, avatar_url)')
        .eq('club_id', clubId);
        
      if (membersError) {
        console.error('Error fetching club members:', membersError);
        return;
      }
      
      // Transform members data
      const members: ClubMember[] = membersData.map(member => ({
        id: member.user.id,
        name: member.user.name,
        avatar: member.user.avatar_url || '/placeholder.svg',
        isAdmin: member.is_admin,
        distanceContribution: member.distance_contribution
      }));
      
      // Fetch match history
      const { data: matchHistory, error: matchError } = await supabase
        .from('matches')
        .select('*')
        .or(`home_club_id.eq.${clubId},away_club_id.eq.${clubId}`)
        .order('end_date', { ascending: false });
        
      if (matchError) {
        console.error('Error fetching match history:', matchError);
      }
      
      // Update the selected club with the full data
      setSelectedClub({
        id: clubData.id,
        name: clubData.name,
        logo: clubData.logo_url || '/placeholder.svg',
        division: clubData.division,
        tier: clubData.tier || 1,
        elitePoints: clubData.elite_points,
        bio: clubData.bio,
        members: members,
        matchHistory: matchHistory || []
      });
      
      setCurrentView('clubDetail');
    } catch (error) {
      console.error('Error in navigateToClubDetail:', error);
      toast({
        title: "Error loading club",
        description: "Could not load complete club data",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return {
    navigateToUserProfile,
    navigateToClubDetail,
    isLoading
  };
};
