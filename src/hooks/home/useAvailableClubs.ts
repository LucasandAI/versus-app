
import { useState, useEffect } from 'react';
import { safeSupabase } from '@/integrations/supabase/safeClient';
import { Division } from '@/types';
import { ensureDivision } from '@/utils/club/leagueUtils';

export interface AvailableClub {
  id: string;
  name: string;
  division: Division;
  tier: number;
  members: number;
  logo: string;
}

export const useAvailableClubs = () => {
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
        const typedData: AvailableClub[] = data.map(club => ({
          ...club,
          division: ensureDivision(club.division)
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
    
    fetchClubs();
  }, []);
  
  return { clubs, loading, error };
};
