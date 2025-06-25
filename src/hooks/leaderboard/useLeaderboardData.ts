
import { useState, useEffect } from 'react';
import { safeSupabase } from '@/integrations/supabase/safeClient';
import { LeaderboardClub } from '@/components/leaderboard/types';
import { Division } from '@/types';
import { ensureDivision } from '@/utils/club/leagueUtils';

export const useLeaderboardData = (selectedDivision: Division | 'All' = 'All') => {
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardClub[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLeaderboardData = async () => {
      setLoading(true);
      try {
        // Fetch clubs with their basic info for leaderboard
        const { data, error } = await safeSupabase
          .from('clubs')
          .select('id, name, division, tier, elite_points, logo, member_count')
          .order('elite_points', { ascending: false })
          .order('tier', { ascending: true });
        
        if (error) {
          setError(error.message);
          return;
        }
        
        // Transform and validate data to match LeaderboardClub type
        const typedData: LeaderboardClub[] = data.map((club, index) => ({
          id: club.id,
          name: club.name,
          division: ensureDivision(club.division), // Ensure division is a valid Division type
          tier: club.tier,
          elitePoints: club.elite_points,
          logo: club.logo || '/placeholder.svg',
          members: club.member_count,
          // Calculate derived properties
          rank: index + 1,
          points: club.division === 'elite' ? club.elite_points : 0,
          change: 'same' as const // Default to 'same' since we don't have historical data
        }));
        
        // Filter by division if specified
        let filteredData = typedData;
        if (selectedDivision !== 'All') {
          filteredData = typedData.filter(club => club.division === selectedDivision);
          // Recalculate ranks for filtered data
          filteredData = filteredData.map((club, index) => ({
            ...club,
            rank: index + 1
          }));
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
