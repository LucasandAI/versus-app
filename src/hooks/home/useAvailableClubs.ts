
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
  const { currentUser, isSessionReady } = useApp();
  const [clubs, setClubs] = useState<AvailableClub[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchClubs = async () => {
    if (!currentUser?.id || !isSessionReady) return;
    
    setLoading(true);
    try {
      console.log('[useAvailableClubs] Fetching available clubs for user:', currentUser.id);
      const { data, error } = await safeSupabase.clubs.getAvailableClubs(currentUser.id);
      
      if (error) {
        setError(error.message);
        return;
      }
      
      // Transform and validate division field to match Division type
      const typedData: AvailableClub[] = data.map(club => ({
        ...club,
        division: ensureDivision(club.division)
      }));
      
      console.log('[useAvailableClubs] Available clubs fetched:', typedData.length);
      setClubs(typedData);
      setError(null);
    } catch (e) {
      setError('Failed to fetch available clubs');
      console.error('[useAvailableClubs] Error:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isSessionReady && currentUser?.id) {
      fetchClubs();
    }
  }, [currentUser?.id, isSessionReady]);
  
  // Listen for user data updates and club membership changes
  useEffect(() => {
    const handleUserDataUpdated = () => {
      console.log('[useAvailableClubs] Data update detected, refreshing clubs');
      fetchClubs();
    };
    
    const handleClubMembershipChanged = (e: CustomEvent) => {
      console.log('[useAvailableClubs] Club membership changed:', e.detail);
      fetchClubs();
    };
    
    window.addEventListener('userDataUpdated', handleUserDataUpdated);
    window.addEventListener('clubMembershipChanged', handleClubMembershipChanged as EventListener);
    
    // Also listen for club membership changes via Supabase realtime
    if (isSessionReady && currentUser?.id) {
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
            console.log('[useAvailableClubs] Club membership changed (DB), refreshing clubs');
            fetchClubs();
          }
        )
        .subscribe();
      
      return () => {
        window.removeEventListener('userDataUpdated', handleUserDataUpdated);
        window.removeEventListener('clubMembershipChanged', handleClubMembershipChanged as EventListener);
        supabase.removeChannel(clubMembershipChannel);
      };
    }
    
    return () => {
      window.removeEventListener('userDataUpdated', handleUserDataUpdated);
      window.removeEventListener('clubMembershipChanged', handleClubMembershipChanged as EventListener);
    };
  }, [currentUser?.id, isSessionReady]);
  
  return { clubs, loading, error, refreshClubs: fetchClubs };
};
