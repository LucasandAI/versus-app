
import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { User, Club } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { UserNavigationResult } from './types';
import { ensureDivision } from '@/utils/club/leagueUtils';

export const useUserNavigation = (): UserNavigationResult => {
  const { setCurrentView, setSelectedUser } = useApp();
  const [isLoading, setIsLoading] = useState(false);

  const navigateToUserProfile = async (userId: string, userName: string, userAvatar: string = '/placeholder.svg') => {
    setIsLoading(true);
    
    try {
      // Create a temporary user object with basic info while we load data
      const tempUser: User = {
        id: userId,
        name: userName,
        avatar: userAvatar,
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
        
      if (error || !userData) {
        console.error('Error fetching user profile:', error);
        return;
      }
      
      // Fetch user's clubs
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
            tier,
            elite_points,
            bio
          )
        `)
        .eq('user_id', userId);
        
      if (clubsError) {
        console.error('Error fetching user clubs:', clubsError);
      }
      
      const clubs: Club[] = [];
      
      if (memberships && memberships.length > 0) {
        for (const membership of memberships) {
          if (!membership.clubs) continue;
          
          // Transform data
          const club = membership.clubs;
          const divisionValue = ensureDivision(club.division);
          
          clubs.push({
            id: club.id,
            name: club.name,
            logo: club.logo || '/placeholder.svg',
            division: divisionValue,
            tier: club.tier || 1,
            elitePoints: club.elite_points || 0,
            bio: club.bio,
            members: [], // Will be populated if needed
            matchHistory: []
          });
        }
      }
      
      // Update the selected user with the fetched data
      setSelectedUser({
        id: userData.id,
        name: userData.name || userName,
        avatar: userData.avatar || userAvatar,
        bio: userData.bio,
        clubs: clubs
      });
      
    } catch (error) {
      console.error('Error in navigateToUserProfile:', error);
      toast({
        title: "Error loading profile",
        description: "Could not load profile data",
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
