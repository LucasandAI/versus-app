
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

  // Start at Bronze 5 (or lower division if needed)
  let divisionIndex = 0;
  let tier = 5;

  const generatedHistory: Match[] = [];

  let matchIndex = 0;
  while (true) {
    // Always win matches to progress toward target division/tier
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
      // Always make club win to progress
      winner: isHomeTeam ? 'home' : 'away',
      leagueAfterMatch: {
        division: nextState.division,
        tier: nextState.tier
      }
    };

    // Generate opponent members with correct distances
    const opponentClub = isHomeTeam ? match.awayClub : match.homeClub;
    const opponentTotalDistance = opponentClub.totalDistance;
    opponentClub.members = Array.from({ length: 4 }).map((_, i) => ({
      id: `opponent-${matchIndex}-member-${i}`,
      name: `${opponentName} Runner ${i + 1}`,
      avatar: '/placeholder.svg',
      isAdmin: i === 0,
      distanceContribution: parseFloat((opponentTotalDistance / 4).toFixed(1))
    }));

    generatedHistory.push(match);

    if (isFinalMatch) break;

    divisionIndex = divisionOrder.indexOf(nextState.division);
    tier = nextState.tier;
    matchIndex++;
    if (matchIndex >= 30) break; // Safety limit
  }

  // Make sure the history is sorted with most recent matches first
  return generatedHistory.sort((a, b) => new Date(b.endDate).getTime() - new Date(a.endDate).getTime());
};
