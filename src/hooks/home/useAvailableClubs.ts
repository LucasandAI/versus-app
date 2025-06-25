
import { useState, useEffect } from 'react';
import { safeSupabase } from '@/integrations/supabase/safeClient';
import { Division, Club } from '@/types';
import { ensureDivision } from '@/utils/club/leagueUtils';
import { useApp } from '@/context/AppContext';
import { supabase } from '@/integrations/supabase/client';

export interface AvailableClub {
  id: string;
  name: string;
  division: Division;
  tier: number;
  members: number;
  logo: string;
}

export const useAvailableClubs = () => {
  const { currentUser } = useApp();
  const [clubs, setClubs] = useState<AvailableClub[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchClubs = async () => {
    setLoading(true);
    try {
      // Get clubs that the current user is NOT a member of
      let query = safeSupabase
        .from('clubs')
        .select('id, name, division, tier, member_count, logo');

      if (currentUser?.id) {
        // Exclude clubs where the user is already a member
        const { data: userClubIds } = await safeSupabase
          .from('club_members')
          .select('club_id')
          .eq('user_id', currentUser.id);

        if (userClubIds && userClubIds.length > 0) {
          const clubIds = userClubIds.map(membership => membership.club_id);
          query = query.not('id', 'in', `(${clubIds.join(',')})`);
        }
      }

      const { data, error } = await query;
      
      if (error) {
        setError(error.message);
        return;
      }
      
      // Transform and validate division field to match Division type
      const typedData: AvailableClub[] = data.map(club => ({
        id: club.id,
        name: club.name,
        division: ensureDivision(club.division),
        tier: club.tier,
        members: club.member_count,
        logo: club.logo || '/placeholder.svg'
      }));
      
      setClubs(typedData);
      setError(null);
    } catch (e) {
      setError('Failed to fetch available clubs');
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClubs();
    
    // Listen for user data updates to refresh club list
    const handleUserDataUpdated = () => {
      console.log('[useAvailableClubs] Data update detected, refreshing clubs');
      fetchClubs();
    };
    
    window.addEventListener('userDataUpdated', handleUserDataUpdated);
    
    // Also listen for club membership changes via Supabase realtime
    const clubMembershipChannel = supabase
      .channel('club-membership-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'club_members'
        },
        () => {
          console.log('[useAvailableClubs] Club membership changed, refreshing clubs');
          fetchClubs();
        }
      )
      .subscribe();
    
    return () => {
      window.removeEventListener('userDataUpdated', handleUserDataUpdated);
      supabase.removeChannel(clubMembershipChannel);
    };
  }, [currentUser?.id]);
  
  return { clubs, loading, error, refreshClubs: fetchClubs };
};
