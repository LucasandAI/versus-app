
import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Club, ClubMember } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { ClubNavigationResult } from './types';

export const useClubNavigation = (): ClubNavigationResult => {
  const { setCurrentView, setSelectedClub } = useApp();
  const [isLoading, setIsLoading] = useState(false);

  const navigateToClubDetail = async (clubId: string, club?: Partial<Club>) => {
    setIsLoading(true);
    
    try {
      // Create a temporary club object with basic info while we load data
      if (club) {
        setSelectedClub(club as Club);
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
        .select(`
          users (
            id,
            name,
            avatar
          ),
          is_admin
        `)
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
        distanceContribution: 0
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
    navigateToClubDetail,
    isLoading
  };
};
