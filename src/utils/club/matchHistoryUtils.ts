
import { Club, Match, ClubMember, Division } from '@/types';
import { calculateNewDivisionAndTier } from './leagueUtils';

export const syncClubDivisionWithMatchHistory = (club: Club): Club => {
  if (!club.matchHistory || club.matchHistory.length === 0) {
    return club;
  }

  const sortedHistory = [...club.matchHistory].sort((a, b) => 
    new Date(b.endDate).getTime() - new Date(a.endDate).getTime()
  );

  const latestMatch = sortedHistory[0];
  
  if (latestMatch.leagueAfterMatch) {
    return {
      ...club,
      division: latestMatch.leagueAfterMatch.division,
      tier: latestMatch.leagueAfterMatch.tier
    };
  }

  const isHomeTeam = latestMatch.homeClub.id === club.id;
  const weWon = (isHomeTeam && latestMatch.winner === 'home') || (!isHomeTeam && latestMatch.winner === 'away');
  
  const newDivisionAndTier = calculateNewDivisionAndTier(club.division, club.tier, weWon);
  
  return {
    ...club,
    division: newDivisionAndTier.division,
    tier: newDivisionAndTier.tier
  };
};

const generateMemberDistances = (members: ClubMember[], totalDistance: number): ClubMember[] => {
  if (!members.length) {
    return [];
  }
  
  let remaining = totalDistance;
  return members.map((member, index) => {
    if (index === members.length - 1) {
      return { ...member, distanceContribution: parseFloat(remaining.toFixed(1)) };
    }
    
    const contribution = parseFloat((Math.random() * (remaining * 0.6)).toFixed(1));
    remaining -= contribution;
    return { ...member, distanceContribution: contribution };
  });
};

export const generateMatchHistoryFromDivision = (club: Club): Match[] => {
  if (!club.division || !club.tier) {
    return [];
  }

  const divisionOrder: Division[] = ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond', 'Elite'];
  const currentDivisionIndex = divisionOrder.indexOf(club.division);
  const currentTier = club.tier;
  
  let divisionIndex = 0;
  let tier = 5;
  
  const generatedHistory: Match[] = [];
  const opponents = ['Weekend Warriors', 'Road Runners', 'Sprint Squad', 'Hill Climbers', 
                     'Mountain Goats', 'Trail Blazers', 'Urban Pacers', 'Night Striders'];
  
  const generatePastDate = (daysAgo: number) => {
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    return date;
  };
  
  let matchIndex = 0;
  while (!(divisionIndex === currentDivisionIndex && tier === currentTier)) {
    const isWin = true;
    const nextState = calculateNewDivisionAndTier(divisionOrder[divisionIndex], tier, isWin);
    
    const opponentName = opponents[Math.floor(Math.random() * opponents.length)];
    const homeDistance = parseFloat((Math.random() * 100 + 150).toFixed(1));
    const awayDistance = isWin ? 
      parseFloat((homeDistance * (0.6 + Math.random() * 0.2)).toFixed(1)) :
      parseFloat((homeDistance * (1.1 + Math.random() * 0.3)).toFixed(1));
    
    const isHomeTeam = matchIndex % 2 === 0;
    
    const endDate = generatePastDate(7 * (matchIndex + 1));
    const startDate = new Date(endDate);
    startDate.setDate(endDate.getDate() - 7);
    
    const match: Match = {
      id: `history-${club.id}-${matchIndex}`,
      homeClub: isHomeTeam ? {
        id: club.id,
        name: club.name,
        logo: club.logo,
        totalDistance: homeDistance,
        members: generateMemberDistances(club.members, homeDistance)
      } : {
        id: `opponent-${matchIndex}`,
        name: opponentName,
        logo: '/placeholder.svg',
        totalDistance: awayDistance,
        members: []
      },
      awayClub: !isHomeTeam ? {
        id: club.id,
        name: club.name,
        logo: club.logo,
        totalDistance: awayDistance,
        members: generateMemberDistances(club.members, awayDistance)
      } : {
        id: `opponent-${matchIndex}`,
        name: opponentName,
        logo: '/placeholder.svg',
        totalDistance: homeDistance,
        members: []
      },
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      status: 'completed',
      winner: isWin ? (isHomeTeam ? 'home' : 'away') : (isHomeTeam ? 'away' : 'home'),
      leagueAfterMatch: {
        division: nextState.division,
        tier: nextState.tier
      }
    };
    
    const opponentClub = isHomeTeam ? match.awayClub : match.homeClub;
    const opponentMemberCount = Math.floor(Math.random() * 3) + 2;
    const opponentDistance = opponentClub.totalDistance;
    opponentClub.members = Array.from({ length: opponentMemberCount }).map((_, i) => {
      const memberDistance = i === opponentMemberCount - 1 ? 
        opponentDistance / opponentMemberCount : 
        parseFloat((Math.random() * (opponentDistance / opponentMemberCount * 1.5)).toFixed(1));
      return {
        id: `opponent-${matchIndex}-member-${i}`,
        name: `Opponent Member ${i + 1}`,
        avatar: '/placeholder.svg',
        isAdmin: i === 0,
        distanceContribution: memberDistance
      };
    });
    
    generatedHistory.push(match);
    
    divisionIndex = divisionOrder.indexOf(nextState.division);
    tier = nextState.tier;
    matchIndex++;
    
    if (matchIndex >= 20) break;
  }
  
  return generatedHistory.sort((a, b) => 
    new Date(b.endDate).getTime() - new Date(a.endDate).getTime()
  );
};

export const ensureClubHasProperMatchHistory = (club: Club): Club => {
  if (!club.matchHistory || club.matchHistory.length === 0) {
    const history = generateMatchHistoryFromDivision(club);
    return {
      ...club,
      matchHistory: history
    };
  }
  
  const latestMatch = [...club.matchHistory].sort((a, b) => 
    new Date(b.endDate).getTime() - new Date(a.endDate).getTime()
  )[0];
  
  if (!latestMatch.leagueAfterMatch || 
      latestMatch.leagueAfterMatch.division !== club.division || 
      latestMatch.leagueAfterMatch.tier !== club.tier) {
    return {
      ...club,
      matchHistory: generateMatchHistoryFromDivision(club)
    };
  }
  
  return club;
};
