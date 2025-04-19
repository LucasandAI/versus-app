
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
  if (!club.division || !club.tier) {
    return [];
  }

  const divisionOrder: Division[] = ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond', 'Elite'];
  const targetState = { division: club.division, tier: club.tier };
  
  // Start from Bronze 5
  let currentDivisionIndex = 0;
  let currentTier = 5;
  
  const generatedHistory: Match[] = [];
  let matchIndex = 0;
  
  // Generate matches until we reach the target division and tier
  while (
    (divisionOrder[currentDivisionIndex] !== targetState.division || 
    currentTier !== targetState.tier) || 
    generatedHistory.length < 7
  ) {
    const opponentName = OPPONENTS[Math.floor(Math.random() * OPPONENTS.length)];
    const homeDistance = parseFloat((Math.random() * 100 + 150).toFixed(1));
    const isHomeTeam = matchIndex % 2 === 0;
    
    // Calculate match outcome
    const isFinalMatch = divisionOrder[currentDivisionIndex] === targetState.division && 
                        currentTier === targetState.tier + 1;
    const isWin = isFinalMatch || Math.random() < 0.75;
    
    const nextState = calculateNewDivisionAndTier(
      divisionOrder[currentDivisionIndex],
      currentTier,
      isWin
    );

    // For the final match that reaches target state, ensure we end at target
    const actualNextState = isWin && isFinalMatch ? targetState : nextState;
    
    const awayDistance = isWin ? 
      parseFloat((homeDistance * (0.6 + Math.random() * 0.2)).toFixed(1)) :
      parseFloat((homeDistance * (1.1 + Math.random() * 0.3)).toFixed(1));
    
    const divisionFactor = (5 - currentDivisionIndex) * 30;
    const tierFactor = currentTier * 7;
    const daysAgo = divisionFactor + tierFactor - matchIndex;
    
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
      winner: isWin ? (isHomeTeam ? 'home' : 'away') : (isHomeTeam ? 'away' : 'home'),
      leagueAfterMatch: actualNextState
    };
    
    generatedHistory.push(match);
    
    // Update position for next iteration
    currentDivisionIndex = divisionOrder.indexOf(actualNextState.division);
    currentTier = actualNextState.tier;
    matchIndex++;
    
    if (matchIndex >= 30) break; // Safety check
    
    // Stop if we've reached target and have enough matches
    if (currentDivisionIndex === divisionOrder.indexOf(targetState.division) && 
        currentTier === targetState.tier &&
        generatedHistory.length >= 7) {
      break;
    }
  }
  
  // Sort by date, most recent first
  return generatedHistory.sort((a, b) => 
    new Date(b.endDate).getTime() - new Date(a.endDate).getTime()
  );
};

