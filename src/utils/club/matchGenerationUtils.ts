
import { Club, Match, Division, ClubMember } from '@/types';
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

  // Generate matches to reach the club's current division and tier
  let remainingMatches = maxMatches;
  const matchResults: boolean[] = [];
  
  // First, determine match results needed to progress to current division/tier
  while (remainingMatches > 0) {
    // Favor wins to progress toward target division, with some losses for realism
    const shouldWin = remainingMatches > 3 ? 
      Math.random() > 0.3 || 
      (currentDivision !== club.division || currentTier > club.tier) : 
      (currentDivision !== club.division || currentTier > club.tier);
    
    // Calculate new division & tier after this match
    const nextState = calculateNewDivisionAndTier(
      currentDivision, 
      currentTier, 
      shouldWin,
      elitePoints
    );
    
    // Record result
    matchResults.push(shouldWin);
    
    // Check if we've reached or exceeded the target division
    if (nextState.division === club.division && nextState.tier === club.tier) {
      // We've reached the exact target
      currentDivision = nextState.division;
      currentTier = nextState.tier;
      if (nextState.elitePoints !== undefined) elitePoints = nextState.elitePoints;
      break;
    } else if (
      divisionOrder.indexOf(nextState.division) > divisionOrder.indexOf(club.division) || 
      (nextState.division === club.division && nextState.tier < club.tier)
    ) {
      // We've overshot the target, change this match to a loss
      matchResults[matchResults.length - 1] = false;
      
      // Recalculate with a loss
      const revisedState = calculateNewDivisionAndTier(
        currentDivision, 
        currentTier, 
        false,
        elitePoints
      );
      
      currentDivision = revisedState.division;
      currentTier = revisedState.tier;
      if (revisedState.elitePoints !== undefined) elitePoints = revisedState.elitePoints;
    } else {
      // Update state and continue
      currentDivision = nextState.division;
      currentTier = nextState.tier;
      if (nextState.elitePoints !== undefined) elitePoints = nextState.elitePoints;
    }
    
    remainingMatches--;
    
    // If we've generated enough matches or can't progress further, stop
    if (remainingMatches <= 0 || (currentDivision === 'Bronze' && currentTier === 5 && !shouldWin)) {
      break;
    }
  }

  // Reset to starting state to generate actual matches
  currentDivision = 'Bronze';
  currentTier = 5;
  elitePoints = 0;
  
  // Generate the actual match objects based on the determined results
  for (let i = 0; i < matchResults.length; i++) {
    const isWin = matchResults[i];
    
    // Calculate the result of this match
    const matchOutcome = calculateNewDivisionAndTier(
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
    
    const memberCount = club.members?.length || 3;
    
    // Generate member distances for home and away teams
    const homeMemberDistances = isHomeTeam 
      ? generateMemberDistances(memberCount, homeDistance)
      : generateOpponentMembers(Math.floor(Math.random() * 2) + 3, homeDistance, opponentName);
    
    const awayMemberDistances = !isHomeTeam 
      ? generateMemberDistances(memberCount, awayDistance)
      : generateOpponentMembers(Math.floor(Math.random() * 2) + 3, awayDistance, opponentName);
    
    const match: Match = {
      id: `history-${club.id}-${i}`,
      homeClub: {
        id: isHomeTeam ? club.id : `opponent-${i}`,
        name: isHomeTeam ? club.name : opponentName,
        logo: isHomeTeam ? (club.logo || '/placeholder.svg') : '/placeholder.svg',
        totalDistance: parseFloat(homeDistance.toFixed(1)),
        members: homeMemberDistances
      },
      awayClub: {
        id: !isHomeTeam ? club.id : `opponent-${i}`,
        name: !isHomeTeam ? club.name : opponentName,
        logo: !isHomeTeam ? (club.logo || '/placeholder.svg') : '/placeholder.svg',
        totalDistance: parseFloat(awayDistance.toFixed(1)),
        members: awayMemberDistances
      },
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      status: 'completed',
      winner: isWin ? (isHomeTeam ? 'home' : 'away') : (isHomeTeam ? 'away' : 'home'),
      leagueAfterMatch: {
        division: matchOutcome.division,
        tier: matchOutcome.tier,
        elitePoints: matchOutcome.elitePoints
      }
    };
    
    generatedHistory.push(match);
    
    // Update for next match
    currentDivision = matchOutcome.division;
    currentTier = matchOutcome.tier;
    if (matchOutcome.elitePoints !== undefined) elitePoints = matchOutcome.elitePoints;
  }
  
  // Sort match history with most recent first
  return generatedHistory.sort((a, b) => 
    new Date(b.endDate).getTime() - new Date(a.endDate).getTime()
  );
};
