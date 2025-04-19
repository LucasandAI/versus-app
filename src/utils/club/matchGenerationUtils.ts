
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
  
  // Start with the lowest division (Bronze 5)
  let currentDivision: Division = 'Bronze';
  let currentTier = 5;
  let elitePoints = 0;

  const generatedHistory: Match[] = [];
  const maxMatches = 10; // Generate up to 10 matches

  // Generate a realistic mix of wins and losses - more wins than losses
  // to ensure progression to the current division
  const matchResults: boolean[] = [];
  
  // Generate matches to progress to current division and tier
  let matchIndex = 0;
  
  while (matchIndex < maxMatches) {
    // For realistic progression, have some losses mixed in
    // but ensure we'll reach the target division eventually
    const shouldWin = Math.random() > 0.3 || 
      (currentDivision === club.division && currentTier > club.tier) || 
      (divisionOrder.indexOf(currentDivision) < divisionOrder.indexOf(club.division));
    
    matchResults.push(shouldWin);
    
    // Calculate new division & tier after this match
    const nextState = calculateNewDivisionAndTier(
      currentDivision, 
      currentTier, 
      shouldWin,
      elitePoints
    );
    
    // Check if we've reached or exceeded the target division
    if (
      (nextState.division === club.division && nextState.tier <= club.tier) ||
      (divisionOrder.indexOf(nextState.division) > divisionOrder.indexOf(club.division))
    ) {
      // We've reached or exceeded our target, start adding some losses
      // to get back to exactly the target division/tier
      if (nextState.division !== club.division || nextState.tier !== club.tier) {
        matchResults[matchIndex] = false; // Change this match to a loss
        const newState = calculateNewDivisionAndTier(
          currentDivision, 
          currentTier, 
          false,
          elitePoints
        );
        currentDivision = newState.division;
        currentTier = newState.tier;
        if (newState.elitePoints !== undefined) elitePoints = newState.elitePoints;
      } else {
        // Exactly at target
        currentDivision = nextState.division;
        currentTier = nextState.tier;
        if (nextState.elitePoints !== undefined) elitePoints = nextState.elitePoints;
        // Stop when we have exactly reached our target
        if (matchIndex >= 2) break; // Ensure we have at least 3 matches
      }
    } else {
      // Not yet at target, continue progression
      currentDivision = nextState.division;
      currentTier = nextState.tier;
      if (nextState.elitePoints !== undefined) elitePoints = nextState.elitePoints;
    }
    
    matchIndex++;
    
    // Safety check to prevent infinite loops
    if (matchIndex >= maxMatches) break;
  }

  // Reset to starting state
  currentDivision = 'Bronze';
  currentTier = 5;
  elitePoints = 0;
  
  // Now generate the actual matches based on our determined results sequence
  for (let i = 0; i < matchResults.length; i++) {
    const isWin = matchResults[i];
    
    // Calculate the new state after this match
    const nextState = calculateNewDivisionAndTier(
      currentDivision, 
      currentTier, 
      isWin,
      elitePoints
    );
    
    const opponentName = OPPONENTS[Math.floor(Math.random() * OPPONENTS.length)];
    
    // Generate higher distances for wins, lower for losses
    const baseDistance = 150 + Math.random() * 50;
    const homeDistance = isWin 
      ? baseDistance * (1.1 + Math.random() * 0.2) 
      : baseDistance * (0.8 + Math.random() * 0.1);
    
    const awayDistance = isWin 
      ? homeDistance * (0.85 + Math.random() * 0.1) 
      : homeDistance * (1.15 + Math.random() * 0.1);
    
    const isHomeTeam = i % 2 === 0; // Alternate home/away
    
    const daysAgo = (matchResults.length - i) * 7; // Spread matches 7 days apart
    const endDate = generatePastDate(daysAgo);
    const startDate = new Date(endDate);
    startDate.setDate(endDate.getDate() - 7);
    
    const match: Match = {
      id: `history-${club.id}-${i}`,
      homeClub: isHomeTeam ? {
        id: club.id,
        name: club.name,
        logo: club.logo || '/placeholder.svg',
        totalDistance: parseFloat(homeDistance.toFixed(1)),
        members: generateMemberDistances(club.members?.length || 3, homeDistance)
      } : {
        id: `opponent-${i}`,
        name: opponentName,
        logo: '/placeholder.svg',
        totalDistance: parseFloat(awayDistance.toFixed(1)),
        members: generateOpponentMembers(Math.floor(Math.random() * 2) + 3, awayDistance)
      },
      awayClub: !isHomeTeam ? {
        id: club.id,
        name: club.name,
        logo: club.logo || '/placeholder.svg',
        totalDistance: parseFloat(awayDistance.toFixed(1)),
        members: generateMemberDistances(club.members?.length || 3, awayDistance)
      } : {
        id: `opponent-${i}`,
        name: opponentName,
        logo: '/placeholder.svg',
        totalDistance: parseFloat(homeDistance.toFixed(1)),
        members: generateOpponentMembers(Math.floor(Math.random() * 2) + 3, homeDistance)
      },
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      status: 'completed',
      winner: isWin ? (isHomeTeam ? 'home' : 'away') : (isHomeTeam ? 'away' : 'home'),
      leagueAfterMatch: {
        division: nextState.division,
        tier: nextState.tier,
        elitePoints: nextState.elitePoints
      }
    };
    
    generatedHistory.push(match);
    
    // Update for next iteration
    currentDivision = nextState.division;
    currentTier = nextState.tier;
    if (nextState.elitePoints !== undefined) elitePoints = nextState.elitePoints;
  }
  
  // Sort match history with most recent first
  return generatedHistory.sort((a, b) => 
    new Date(b.endDate).getTime() - new Date(a.endDate).getTime()
  );
};
