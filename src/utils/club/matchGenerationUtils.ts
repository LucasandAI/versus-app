
import { Club, Match, Division } from '@/types';
import { generateMemberDistances, generateOpponentMembers } from './memberDistanceUtils';
import { calculateNewDivisionAndTier } from './leagueUtils';

const generatePastDate = (daysAgo: number) => {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date;
};

const OPPONENTS = [
  'Weekend Warriors', 'Road Runners', 'Sprint Squad', 'Hill Climbers',
  'Mountain Goats', 'Trail Blazers', 'Urban Pacers', 'Night Striders'
];

export const generateMatchHistoryFromDivision = (club: Club): Match[] => {
  if (!club.division || !club.tier) return [];

  const divisionOrder: Division[] = ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond', 'Elite'];
  const targetDivisionIndex = divisionOrder.indexOf(club.division);
  const targetTier = club.tier;

  let divisionIndex = 0;
  let tier = 5;

  const generatedHistory: Match[] = [];

  const generatePastDate = (daysAgo: number) => {
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    return date;
  };

  let matchIndex = 0;
  while (true) {
    const nextState = calculateNewDivisionAndTier(divisionOrder[divisionIndex], tier, true);

    const isFinalMatch = 
      nextState.division === club.division &&
      nextState.tier === club.tier;

    const opponentName = OPPONENTS[Math.floor(Math.random() * OPPONENTS.length)];
    const homeDistance = parseFloat((Math.random() * 100 + 150).toFixed(1));
    const awayDistance = parseFloat((homeDistance * (0.6 + Math.random() * 0.2)).toFixed(1));
    const isHomeTeam = matchIndex % 2 === 0;

    const daysAgo = 7 * (matchIndex + 1);
    const endDate = generatePastDate(daysAgo);
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
        members: generateOpponentMembers(opponentName, matchIndex, awayDistance)
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
        members: generateOpponentMembers(opponentName, matchIndex, homeDistance)
      },
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      status: 'completed',
      winner: isHomeTeam ? 'home' : 'away',
      leagueAfterMatch: {
        division: nextState.division,
        tier: nextState.tier
      }
    };

    generatedHistory.push(match);

    if (isFinalMatch) break;

    divisionIndex = divisionOrder.indexOf(nextState.division);
    tier = nextState.tier;
    matchIndex++;
    if (matchIndex >= 30) break;
  }

  return generatedHistory.sort((a, b) => new Date(b.endDate).getTime() - new Date(a.endDate).getTime());
};
