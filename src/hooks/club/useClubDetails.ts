
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Club } from '@/types';
import { ensureDivision } from '@/utils/club/leagueUtils';

export const useClubDetails = (clubId: string | undefined) => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  const fetchClubDetails = async (): Promise<Partial<Club> | null> => {
    if (!clubId) {
      console.log('[useClubDetails] No club ID provided');
      return null;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('[useClubDetails] Fetching club details for:', clubId);
      const { data: clubData, error } = await supabase
        .from('clubs')
        .select('id, name, logo, division, tier, bio, elite_points, created_by')
        .eq('id', clubId)
        .single();
        
      if (error) {
        console.error('[useClubDetails] Supabase error:', error);
        throw new Error('Error fetching club: ' + error.message);
      }
      
      if (!clubData) {
        console.error('[useClubDetails] No club data found for ID:', clubId);
        throw new Error('No club data found');
      }
      
      console.log('[useClubDetails] Club data fetched successfully:', clubData);
      
      return {
        id: clubData.id,
        name: clubData.name,
        logo: clubData.logo || '/placeholder.svg',
        division: ensureDivision(clubData.division),
        tier: clubData.tier || 1,
        elitePoints: clubData.elite_points || 0,
        bio: clubData.bio,
        members: [], // Will be populated by useClubMembers
        matchHistory: [], // Will be populated by useClubMatches
        // Store the creator ID to help determine admin status
        created_by: clubData.created_by
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('[useClubDetails] Error:', errorMessage);
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return { fetchClubDetails, isLoading, error };
};
