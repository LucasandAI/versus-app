
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
      
      // Fetch user data from Supabase
      const { data: userData, error } = await supabase
        .from('users')
        .select('id, name, avatar, strava_connected, bio')
        .eq('id', userId)
        .single();
        
      if (error) {
        console.error('Error fetching user profile:', error);
        return;
      }
      
      // Fetch user's clubs from Supabase via club_members join table
      const { data: memberships, error: clubsError } = await supabase
        .from('club_members')
        .select('club_id, is_admin, club:clubs(id, name, logo, division, tier, elite_points)')
        .eq('user_id', userId);
        
      if (clubsError) {
        console.error('Error fetching user clubs:', clubsError);
      }
      
      // Transform the clubs data
      const clubs: Club[] = [];
      
      if (memberships && memberships.length > 0) {
        for (const membership of memberships) {
          if (!membership.club) continue;
          
          // Fetch club members
          const { data: membersData, error: membersError } = await supabase
            .from('club_members')
            .select('user_id, is_admin, users(id, name, avatar)')
            .eq('club_id', membership.club.id);
            
          if (membersError) {
            console.error('Error fetching club members:', membersError);
            continue;
          }
          
          // Transform members data
          const members: ClubMember[] = membersData.map(member => ({
            id: member.users.id,
            name: member.users.name,
            avatar: member.users.avatar || '/placeholder.svg',
            isAdmin: member.is_admin,
            distanceContribution: 0 // Default value
          }));
          
          // Fetch match history
          const { data: matchHistory, error: matchError } = await supabase
            .from('matches')
            .select('*')
            .or(`home_club_id.eq.${membership.club.id},away_club_id.eq.${membership.club.id}`)
            .order('end_date', { ascending: false });
            
          if (matchError) {
            console.error('Error fetching match history:', matchError);
          }
          
          // Transform club data
          clubs.push({
            id: membership.club.id,
            name: membership.club.name,
            logo: membership.club.logo || '/placeholder.svg',
            division: membership.club.division,
            tier: membership.club.tier || 1,
            elitePoints: membership.club.elite_points,
            members: members,
            matchHistory: matchHistory || []
          });
        }
      }
      
      // Update the selected user with the transformed data
      setSelectedUser({
        id: userData.id,
        name: userData.name || userName,
        avatar: userData.avatar || userAvatar,
        stravaConnected: Boolean(userData.strava_connected),
        bio: userData.bio,
        clubs: clubs
      });
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
        .select('id, name, logo, division, tier, elite_points, bio')
        .eq('id', clubId)
        .single();
        
      if (error) {
        console.error('Error fetching club:', error);
        return;
      }
      
      // Fetch club members
      const { data: membersData, error: membersError } = await supabase
        .from('club_members')
        .select('user_id, is_admin, users(id, name, avatar)')
        .eq('club_id', clubId);
        
      if (membersError) {
        console.error('Error fetching club members:', membersError);
        return;
      }
      
      // Transform members data
      const members: ClubMember[] = membersData.map(member => ({
        id: member.users.id,
        name: member.users.name,
        avatar: member.users.avatar || '/placeholder.svg',
        isAdmin: member.is_admin,
        distanceContribution: 0 // Default value
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
      
      if (clubData) {
        // Update the selected club with the full data
        setSelectedClub({
          id: clubData.id,
          name: clubData.name,
          logo: clubData.logo || '/placeholder.svg',
          division: clubData.division,
          tier: clubData.tier || 1,
          elitePoints: clubData.elite_points,
          bio: clubData.bio,
          members: members,
          matchHistory: matchHistory || []
        });
      }
      
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
