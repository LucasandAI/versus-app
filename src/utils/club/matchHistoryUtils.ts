
import { Club, ClubMember, Division, Match } from '@/types';
import { ensureDivision } from './leagueUtils';

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
    
    try {
      // If it's a string, try to parse it as JSON
      if (typeof leagueData === 'string') {
        const parsed = JSON.parse(leagueData);
        return {
          division: ensureDivision(parsed.division || 'bronze'),
          tier: parseInt(parsed.tier || '1', 10),
          elitePoints: parseInt(parsed.elite_points || '0', 10)
        };
      }
      
      // If it's already an object
      return {
        division: ensureDivision(leagueData.division || 'bronze'),
        tier: parseInt(leagueData.tier || '1', 10),
        elitePoints: parseInt(leagueData.elite_points || '0', 10)
      };
    } catch (e) {
      console.error('Error parsing league data:', e);
      return {
        division: 'bronze' as Division,
        tier: 1,
        elitePoints: 0
      };
    }
  };
  
  // Parse winner to ensure it matches the expected union type
  const parseWinner = (winnerValue: string | null): 'home' | 'away' | 'draw' | undefined => {
    if (!winnerValue) return undefined;
    
    if (winnerValue === 'home' || winnerValue === 'away' || winnerValue === 'draw') {
      return winnerValue;
    }
    
    // If it doesn't match, determine based on total distance
    const homeDistance = homeClubInfo.members.reduce((sum, m) => sum + (m.distanceContribution || 0), 0);
    const awayDistance = awayClubInfo.members.reduce((sum, m) => sum + (m.distanceContribution || 0), 0);
    
    if (homeDistance > awayDistance) return 'home';
    if (awayDistance > homeDistance) return 'away';
    return 'draw';
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
    winner: parseWinner(matchData.winner),
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

// For generating mock match history
export const generateMatchHistoryFromDivision = (club: Club): Match[] => {
  // Generate a basic match history appropriate for the club's division
  const matchCount = 5;
  const result: Match[] = [];
  
  for (let i = 0; i < matchCount; i++) {
    const isWin = Math.random() > 0.4; // 60% win rate
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - (i + 1) * 7);
    
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 5);
    
    const homeDistance = Math.round((50 + Math.random() * 50) * 10) / 10;
    const awayDistance = Math.round((isWin ? homeDistance * 0.9 : homeDistance * 1.1) * 10) / 10;
    
    const match: Match = {
      id: `mock-${i}-${club.id}`,
      homeClub: {
        id: club.id,
        name: club.name,
        logo: club.logo,
        totalDistance: homeDistance,
        members: club.members.map(member => ({
          ...member,
          distanceContribution: homeDistance / (club.members.length || 1)
        }))
      },
      awayClub: {
        id: `opponent-${i}`,
        name: `Opponent ${i+1}`,
        logo: '/placeholder.svg',
        totalDistance: awayDistance,
        members: []
      },
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      status: 'completed',
      winner: isWin ? 'home' : 'away',
      leagueBeforeMatch: {
        division: club.division,
        tier: club.tier,
        elitePoints: club.division === 'elite' ? club.elitePoints : undefined
      },
      leagueAfterMatch: {
        division: club.division,
        tier: club.tier,
        elitePoints: club.division === 'elite' ? club.elitePoints : undefined
      }
    };
    
    result.push(match);
  }
  
  return result;
};
