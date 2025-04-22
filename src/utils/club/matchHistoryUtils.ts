import { Club, Match, Division, ClubMember } from '@/types';

// Transform raw match data from Supabase into typed Match objects
export const transformMatchData = (
  matchData: any,
  clubId: string,
  allClubs: Map<string, {name: string, logo: string, members: ClubMember[]}>
): Match => {
  const isHomeClub = matchData.home_club_id === clubId;
  const homeClubId = matchData.home_club_id;
  const awayClubId = matchData.away_club_id;
  
  const homeClubInfo = allClubs.get(homeClubId) || { 
    name: 'Unknown Club', 
    logo: '/placeholder.svg',
    members: []
  };
  
  const awayClubInfo = allClubs.get(awayClubId) || { 
    name: 'Unknown Club', 
    logo: '/placeholder.svg',
    members: []
  };
  
  // Transform winner value to expected union type or undefined
  let winner: 'home' | 'away' | 'draw' | undefined;
  if (matchData.winner === 'home' || matchData.winner === 'away' || matchData.winner === 'draw') {
    winner = matchData.winner;
  }
  
  // Transform league data
  const transformLeagueData = (leagueData: any) => {
    if (!leagueData) return undefined;
    
    // Check if it's a string that needs to be parsed
    const data = typeof leagueData === 'string' ? JSON.parse(leagueData) : leagueData;
    
    return {
      division: (data.division || 'bronze').toLowerCase() as Division,
      tier: data.tier || 1,
      elitePoints: data.elitePoints || 0
    };
  };
  
  return {
    id: matchData.id,
    homeClub: {
      id: homeClubId,
      name: homeClubInfo.name,
      logo: homeClubInfo.logo,
      totalDistance: 0, // This would need to be calculated from match_distances
      members: homeClubInfo.members || []
    },
    awayClub: {
      id: awayClubId,
      name: awayClubInfo.name,
      logo: awayClubInfo.logo,
      totalDistance: 0, // This would need to be calculated from match_distances
      members: awayClubInfo.members || []
    },
    startDate: matchData.start_date,
    endDate: matchData.end_date,
    status: new Date(matchData.end_date) > new Date() ? 'active' : 'completed',
    winner: winner,
    leagueBeforeMatch: transformLeagueData(matchData.league_before_match),
    leagueAfterMatch: transformLeagueData(matchData.league_after_match)
  };
};

export const generateMatchHistoryFromDivision = (club: Club): Match[] => {
  const numberOfMatches = 5;
  const matchHistory: Match[] = [];

  for (let i = 0; i < numberOfMatches; i++) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - (i * 7)); // One week apart

    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 6); // 7-day match

    const totalDistanceHome = Math.floor(Math.random() * 100);
    const totalDistanceAway = Math.floor(Math.random() * 100);

    const winner = totalDistanceHome > totalDistanceAway ? 'home' : 'away';

    matchHistory.push({
      id: `match-${i}`,
      homeClub: {
        id: club.id,
        name: club.name,
        logo: club.logo,
        totalDistance: totalDistanceHome,
        members: club.members
      },
      awayClub: {
        id: 'away-club-id', // Replace with actual away club ID if available
        name: 'Away Club', // Replace with actual away club name if available
        logo: '/placeholder.svg', // Replace with actual away club logo if available
        totalDistance: totalDistanceAway,
        members: club.members
      },
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      status: 'completed',
      winner: winner,
      leagueBeforeMatch: {
        division: club.division,
        tier: club.tier,
        elitePoints: club.elitePoints
      },
      leagueAfterMatch: {
        division: club.division,
        tier: club.tier,
        elitePoints: club.elitePoints
      }
    });
  }
  return [];
};
