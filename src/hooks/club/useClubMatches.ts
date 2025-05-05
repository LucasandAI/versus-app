
import { Match } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { transformMatchData } from '@/utils/club/matchHistoryUtils';
import { ensureDivision } from '@/utils/club/leagueUtils';
import { Json } from '@/integrations/supabase/types';

// Helper function to safely access JSON object properties
const getJsonObjectProperty = (json: Json | null, property: string, defaultValue: any): any => {
  if (!json || typeof json !== 'object' || Array.isArray(json)) {
    return defaultValue;
  }
  
  // Now TypeScript knows json is a non-array object
  return (json as Record<string, Json>)[property] ?? defaultValue;
};

export const useClubMatches = () => {
  const fetchClubMatches = async (clubId: string): Promise<Match[]> => {
    const { data: matchHistory, error: matchError } = await supabase
      .from('matches')
      .select('*')
      .or(`home_club_id.eq.${clubId},away_club_id.eq.${clubId}`)
      .order('end_date', { ascending: false });
      
    if (matchError) {
      throw new Error('Error fetching match history: ' + matchError.message);
    }

    const enhancedMatches: Match[] = [];
    
    for (const match of matchHistory || []) {
      try {
        const homeClubData = await supabase
          .from('clubs')
          .select('id, name, logo')
          .eq('id', match.home_club_id)
          .single();
          
        const awayClubData = await supabase
          .from('clubs')
          .select('id, name, logo')
          .eq('id', match.away_club_id)
          .single();
          
        if (!homeClubData.data || !awayClubData.data) continue;

        const { data: distances } = await supabase
          .from('match_distances')
          .select('user_id, club_id, distance_contributed')
          .eq('match_id', match.id);

        const matchStatus = new Date(match.end_date) > new Date() ? 'active' : 'completed';

        // Type cast league data properly
        const leagueBeforeMatch = match.league_before_match ? {
          division: ensureDivision(
            getJsonObjectProperty(match.league_before_match, 'division', 'bronze')
          ),
          tier: Number(getJsonObjectProperty(match.league_before_match, 'tier', 1)),
          elitePoints: Number(getJsonObjectProperty(match.league_before_match, 'elite_points', 0))
        } : undefined;
        
        const leagueAfterMatch = match.league_after_match ? {
          division: ensureDivision(
            getJsonObjectProperty(match.league_after_match, 'division', 'bronze')
          ),
          tier: Number(getJsonObjectProperty(match.league_after_match, 'tier', 1)),
          elitePoints: Number(getJsonObjectProperty(match.league_after_match, 'elite_points', 0))
        } : undefined;

        const enhancedMatch = {
          id: match.id,
          homeClub: {
            id: homeClubData.data.id,
            name: homeClubData.data.name,
            logo: homeClubData.data.logo || '/placeholder.svg',
            totalDistance: 0,
            members: []
          },
          awayClub: {
            id: awayClubData.data.id,
            name: awayClubData.data.name,
            logo: awayClubData.data.logo || '/placeholder.svg',
            totalDistance: 0,
            members: []
          },
          startDate: match.start_date,
          endDate: match.end_date,
          status: matchStatus as 'active' | 'completed',
          winner: match.winner as 'home' | 'away' | 'draw' | undefined,
          leagueBeforeMatch,
          leagueAfterMatch
        };

        enhancedMatches.push(enhancedMatch);
      } catch (error) {
        console.error('Error processing match:', error);
      }
    }
    
    return enhancedMatches;
  };

  return { fetchClubMatches };
};
