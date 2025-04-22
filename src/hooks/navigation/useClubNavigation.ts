
import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Club, ClubMember } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { ClubNavigationResult } from './types';
import { transformMatchData } from '@/utils/club/matchHistoryUtils';
import { ensureDivision } from '@/utils/club/leagueUtils';

export const useClubNavigation = (): ClubNavigationResult => {
  const { setCurrentView, setSelectedClub } = useApp();
  const [isLoading, setIsLoading] = useState(false);

  const navigateToClubDetail = async (clubId: string, initialClub?: Partial<Club>, skipDataFetch?: boolean) => {
    setIsLoading(true);
    
    try {
      // Create a temporary club object with basic info while we load data
      if (initialClub) {
        const tempClub: Club = {
          id: clubId,
          name: initialClub.name || '',
          logo: initialClub.logo || '/placeholder.svg',
          division: initialClub.division || 'bronze',
          tier: initialClub.tier || 1,
          elitePoints: initialClub.elitePoints || 0,
          members: [],
          matchHistory: []
        };
        setSelectedClub(tempClub);
        setCurrentView('clubDetail');
      }
      
      // If skipDataFetch is true, don't fetch data (useful for cases where data is already available)
      if (skipDataFetch) {
        setIsLoading(false);
        return;
      }
      
      // Fetch full club data
      const { data: clubData, error } = await supabase
        .from('clubs')
        .select('id, name, logo, division, tier, elite_points, bio')
        .eq('id', clubId)
        .single();
        
      if (error || !clubData) {
        console.error('Error fetching club:', error);
        toast({
          title: "Error loading club",
          description: "Could not load club details",
          variant: "destructive"
        });
        return;
      }
      
      // Fetch club members
      const { data: membersData, error: membersError } = await supabase
        .from('club_members')
        .select('user_id, is_admin, users(id, name, avatar)')
        .eq('club_id', clubId);
        
      if (membersError || !membersData) {
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
      const { data: matchesData, error: matchError } = await supabase
        .from('matches')
        .select('*')
        .or(`home_club_id.eq.${clubId},away_club_id.eq.${clubId}`)
        .order('end_date', { ascending: false });
        
      if (matchError) {
        console.error('Error fetching match history:', matchError);
      }
      
      // Process match data
      const transformedMatches = matchesData ? 
        matchesData.map(match => transformMatchData(match, clubId)) : 
        [];
      
      // Update the selected club with the full data
      const divisionValue = ensureDivision(clubData.division);
      
      setSelectedClub({
        id: clubData.id,
        name: clubData.name,
        logo: clubData.logo || '/placeholder.svg',
        division: divisionValue,
        tier: clubData.tier || 1,
        elitePoints: clubData.elite_points || 0,
        bio: clubData.bio,
        members: members,
        matchHistory: transformedMatches
      });
      
      setCurrentView('clubDetail');
    } catch (error) {
      console.error('Error in navigateToClubDetail:', error);
      toast({
        title: "Error loading club",
        description: "Could not load club details",
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
