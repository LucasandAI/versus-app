
import { useState, useEffect } from 'react';
import { safeSupabase } from '@/integrations/supabase/safeClient';
import { Division, Club } from '@/types';
import { ensureDivision } from '@/utils/club/leagueUtils';
import { useApp } from '@/context/AppContext';

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

  useEffect(() => {
    const fetchClubs = async () => {
      setLoading(true);
      try {
        const { data, error } = await safeSupabase.clubs.getAvailableClubs();
        
        if (error) {
          setError(error.message);
          return;
        }
        
        // Transform and validate division field to match Division type
        let typedData: AvailableClub[] = data.map(club => ({
          ...club,
          division: ensureDivision(club.division)
        }));
        
        // Filter out clubs that the user is already a member of
        if (currentUser && currentUser.clubs) {
          const userClubIds = currentUser.clubs.map(club => club.id);
          typedData = typedData.filter(club => !userClubIds.includes(club.id));
        }
        
        setClubs(typedData);
        setError(null);
      } catch (e) {
        setError('Failed to fetch available clubs');
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    
    fetchClubs();
  }, [currentUser]);
  
  return { clubs, loading, error };
};
