
import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { User, Club, ClubMember } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { UserNavigationResult } from './types';

export const useUserNavigation = (): UserNavigationResult => {
  const { setCurrentView, setSelectedUser, currentUser } = useApp();
  const [isLoading, setIsLoading] = useState(false);

  const navigateToUserProfile = async (userId: string, userName: string, userAvatar: string = '/placeholder.svg') => {
    setIsLoading(true);
    
    try {
      // Create a temporary user object with basic info while we load data
      const tempUser: User = {
        id: userId,
        name: userName,
        avatar: userAvatar,
        stravaConnected: false, // Default since we don't have this column yet
        clubs: []
      };
      
      setSelectedUser(tempUser);
      setCurrentView('profile');
      
      // Fetch user data from Supabase
      const { data: userData, error } = await supabase
        .from('users')
        .select('id, name, avatar, bio')
        .eq('id', userId)
        .single();
        
      if (error) {
        console.error('Error fetching user profile:', error);
        return;
      }
      
      // Fetch user's clubs with members
      const { data: memberships, error: clubsError } = await supabase
        .from('club_members')
        .select(`
          club_id,
          is_admin,
          clubs (
            id,
            name,
            logo,
            division,
            tier
          )
        `)
        .eq('user_id', userId);
        
      if (clubsError) {
        console.error('Error fetching user clubs:', clubsError);
      }
      
      // Transform the clubs data
      const clubs: Club[] = [];
      
      if (memberships) {
        for (const membership of memberships) {
          const club = membership.clubs;
          if (!club) continue;
          
          // Fetch club members
          const { data: membersData, error: membersError } = await supabase
            .from('club_members')
            .select(`
              users (
                id,
                name,
                avatar
              ),
              is_admin
            `)
            .eq('club_id', club.id);
            
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
            distanceContribution: 0
          }));
          
          // Fetch match history
          const { data: matchHistory, error: matchError } = await supabase
            .from('matches')
            .select('*')
            .or(`home_club_id.eq.${club.id},away_club_id.eq.${club.id}`)
            .order('end_date', { ascending: false });
            
          if (matchError) {
            console.error('Error fetching match history:', matchError);
          }
          
          clubs.push({
            id: club.id,
            name: club.name,
            logo: club.logo || '/placeholder.svg',
            division: club.division.toLowerCase() as any,
            tier: club.tier || 1,
            elitePoints: 0, // Default since we don't have this column yet
            members: members,
            matchHistory: matchHistory || []
          });
        }
      }
      
      // Update the selected user with the fetched data
      setSelectedUser({
        id: userData.id,
        name: userData.name || userName,
        avatar: userData.avatar || userAvatar,
        stravaConnected: false, // Default since we don't have this column yet
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

  return {
    navigateToUserProfile,
    isLoading
  };
};
