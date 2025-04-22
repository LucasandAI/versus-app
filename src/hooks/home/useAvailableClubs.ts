
import { useState, useEffect } from 'react';
import { safeSupabase } from '@/integrations/supabase/safeClient';

export interface AvailableClub {
  id: string;
  name: string;
  division: string;
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
        
        setClubs(data);
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
