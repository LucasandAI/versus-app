
import { useState, useEffect } from 'react';
import { safeSupabase } from '@/integrations/supabase/safeClient';
import { LeaderboardClub } from '@/components/leaderboard/types';
import { Division } from '@/types';

export const useLeaderboardData = (selectedDivision: Division | 'All' = 'All') => {
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardClub[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLeaderboardData = async () => {
      setLoading(true);
      try {
        const { data, error } = await safeSupabase.clubs.getLeaderboardClubs();
        
        if (error) {
          setError(error.message);
          return;
        }
        
        // Filter by division if specified
        let filteredData = data;
        if (selectedDivision !== 'All') {
          filteredData = data.filter(club => club.division === selectedDivision);
        }
        
        setLeaderboardData(filteredData);
        setError(null);
      } catch (e) {
        setError('Failed to fetch leaderboard data');
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    
    fetchLeaderboardData();
  }, [selectedDivision]);
  
  return { leaderboardData, loading, error };
};
