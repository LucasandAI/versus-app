
import { useState } from 'react';
import { safeSupabase } from '@/integrations/supabase/safeClient';
import { Club } from '@/types';
import { ensureDivision } from '@/utils/club/leagueUtils';

export const useClubDetails = (clubId: string | undefined) => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  const fetchClubDetails = async () => {
    if (!clubId) return null;
    
    try {
      const { data: clubData, error } = await safeSupabase
        .from('clubs')
        .select('id, name, logo, division, tier, bio, elite_points')
        .eq('id', clubId)
        .single();
        
      if (error) throw new Error('Error fetching club: ' + error.message);
      if (!clubData) throw new Error('No club data found');
      
      return {
        id: clubData.id,
        name: clubData.name,
        logo: clubData.logo || '/placeholder.svg',
        division: ensureDivision(clubData.division),
        tier: clubData.tier || 1,
        elitePoints: clubData.elite_points || 0,
        bio: clubData.bio,
        members: [], // Will be populated by useClubMembers
        matchHistory: [] // Will be populated by useClubMatches
      };
    } catch (error) {
      throw error;
    }
  };

  return { fetchClubDetails, isLoading, error };
};
