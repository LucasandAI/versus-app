
import { Club, ClubMember, Division, Match } from '@/types';

// Transform raw match data from Supabase into our Match type
export const transformMatchData = (
  matchData: any,
  currentClubId: string,
  clubsMap: Map<string, {name: string, logo: string, members: ClubMember[]}>
): Match => {
  const isHomeTeam = matchData.home_club_id === currentClubId;
  const homeClubInfo = clubsMap.get(matchData.home_club_id) || { name: 'Unknown Club', logo: '/placeholder.svg', members: [] };
  const awayClubInfo = clubsMap.get(matchData.away_club_id) || { name: 'Unknown Club', logo: '/placeholder.svg', members: [] };
  
  // Parse league data
  const parseLeagueData = (leagueData: any) => {
    if (!leagueData) return undefined;
    
    // If it's a string, try to parse it as JSON
    if (typeof leagueData === 'string') {
      try {
        const parsed = JSON.parse(leagueData);
        return {
          division: (parsed.division || 'bronze').toLowerCase() as Division,
          tier: parsed.tier || 1,
          elitePoints: parsed.elite_points || 0
        };
      } catch (e) {
        console.error('Error parsing league data:', e);
        return {
          division: 'bronze' as Division,
          tier: 1,
          elitePoints: 0
        };
      }
    }
    
    // If it's already an object
    return {
      division: ((leagueData.division || 'bronze') + '').toLowerCase() as Division,
      tier: leagueData.tier || 1,
      elitePoints: leagueData.elite_points || 0
    };
  };
  
  return {
    id: matchData.id,
    homeClub: {
      id: matchData.home_club_id,
      name: homeClubInfo.name,
      logo: homeClubInfo.logo,
      totalDistance: 0, // This would need to be calculated from distances
      members: homeClubInfo.members
    },
    awayClub: {
      id: matchData.away_club_id,
      name: awayClubInfo.name,
      logo: awayClubInfo.logo,
      totalDistance: 0, // This would need to be calculated from distances
      members: awayClubInfo.members
    },
    startDate: matchData.start_date,
    endDate: matchData.end_date,
    status: new Date(matchData.end_date) > new Date() ? 'active' : 'completed',
    winner: matchData.winner as 'home' | 'away' | 'draw',
    leagueBeforeMatch: parseLeagueData(matchData.league_before_match),
    leagueAfterMatch: parseLeagueData(matchData.league_after_match)
  };
};

export const transformRawMatchesToMatchType = (matches: any[], clubId: string): Match[] => {
  if (!matches || matches.length === 0) return [];
  
  return matches.map(match => {
    // Create a simple clubs map for this match
    const clubsMap = new Map();
    clubsMap.set(match.home_club_id, { 
      name: 'Home Club', 
      logo: '/placeholder.svg',
      members: [] 
    });
    clubsMap.set(match.away_club_id, { 
      name: 'Away Club', 
      logo: '/placeholder.svg',
      members: [] 
    });
    
    return transformMatchData(match, clubId, clubsMap);
  });
};
