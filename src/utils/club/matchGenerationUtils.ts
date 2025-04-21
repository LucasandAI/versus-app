import { Club, Match, Division, ClubMember } from '@/types';
import { generateMemberDistances, generateOpponentMembers } from './memberDistanceUtils';

const generatePastDate = (daysAgo: number) => {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date;
};

const OPPONENTS = [
  'Weekend Warriors', 'Road Runners', 'Sprint Squad', 'Hill Climbers',
  'Mountain Goats', 'Trail Blazers', 'Urban Pacers', 'Night Striders',
  'Marathon Masters', 'Peak Performers', 'Distance Demons', 'Endurance Elite'
];

export const generateMatchHistoryFromDivision = (club: Club): Match[] => {
  console.log(`REBUILT: Generating match history for ${club.name} (${club.division} ${club.tier || 1})`);

  // Define division progression path
  const divisionOrder: Division[] = ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond', 'Elite'];
  
  // Always start from Bronze 5
  const startingDivision = 'Bronze' as Division;
  const startingTier = 5;
  
  // Calculate how many matches needed to reach current division/tier
  let matchPath: Array<{
    needToWin: boolean;
    division: Division;
    tier: number;
    elitePoints?: number;
  }> = [];
  
  // Start with Bronze 5
  let currentDivision = startingDivision;
  let currentTier = startingTier;
  let elitePoints = 0;
  
  console.log(`Building path from ${currentDivision} ${currentTier} to ${club.division} ${club.tier || 1}`);
  
  // Generate the division/tier path that the club would have taken
  while (currentDivision !== club.division || currentTier !== (club.tier || 1)) {
    // For progression, we always need to win
    const needToWin = true;
    
    // Add current state to the path
    matchPath.push({
      needToWin,
      division: currentDivision,
      tier: currentTier,
      elitePoints: currentDivision === 'Elite' ? elitePoints : undefined
    });
    
    // Calculate next state based on a win
    if (currentTier === 1) {
      // If at tier 1, move to next division at tier 5 (or Elite tier 1)
      const currentDivIndex = divisionOrder.indexOf(currentDivision);
      if (currentDivIndex < divisionOrder.length - 1) {
        currentDivision = divisionOrder[currentDivIndex + 1];
        currentTier = currentDivision === 'Elite' ? 1 : 5;
        if (currentDivision === 'Elite') elitePoints = 0;
      }
    } else {
      // Otherwise move up one tier in same division
      currentTier--;
    }
    
    // Safety break to prevent infinite loop
    if (matchPath.length > 30) {
      console.log("Safety break - too many matches in path");
      break;
    }
  }
  
  // Add the final state to complete the path
  matchPath.push({
    needToWin: true,
    division: club.division,
    tier: club.tier || 1,
    elitePoints: club.division === 'Elite' ? (club.elitePoints || 0) : undefined
  });
  
  console.log(`Generated path with ${matchPath.length} states from Bronze 5 to ${club.division} ${club.tier || 1}`);
  
  // Now generate actual matches based on the path
  const generatedHistory: Match[] = [];
  
  for (let i = 0; i < matchPath.length - 1; i++) {
    const beforeState = matchPath[i];
    const afterState = matchPath[i + 1];
    
    // Opponent details
    const opponentName = OPPONENTS[Math.floor(Math.random() * OPPONENTS.length)];
    const isHomeTeam = i % 2 === 0;
    
    // Generate date ranges - older matches first
    const totalMatches = matchPath.length - 1;
    const daysAgo = Math.floor((totalMatches - i) * (7 + Math.random() * 3));
    const endDate = generatePastDate(daysAgo);
    const startDate = new Date(endDate);
    startDate.setDate(endDate.getDate() - 7);
    
    // Generate distances ensuring winner has more distance
    const baseDistance = 150 + Math.random() * 150;
    const winnerMultiplier = 1.15 + Math.random() * 0.3;
    const loserMultiplier = 0.7 + Math.random() * 0.2;
    
    const homeDistance = isHomeTeam ? baseDistance * winnerMultiplier : baseDistance * loserMultiplier;
    const awayDistance = !isHomeTeam ? baseDistance * winnerMultiplier : baseDistance * loserMultiplier;
    
    // Generate member distances
    const memberCount = club.members?.length || 5;
    const homeMemberDistances = isHomeTeam 
      ? generateMemberDistances(memberCount, homeDistance)
      : generateOpponentMembers(Math.floor(Math.random() * 3) + 3, homeDistance, opponentName);
    
    const awayMemberDistances = !isHomeTeam 
      ? generateMemberDistances(memberCount, awayDistance)
      : generateOpponentMembers(Math.floor(Math.random() * 3) + 3, awayDistance, opponentName);
    
    // Create match with both leagueBeforeMatch and leagueAfterMatch
    const match: Match = {
      id: `match-${club.id}-${i}`,
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
      winner: isHomeTeam ? 'home' : 'away', // Club always wins since we're building a progression
      leagueBeforeMatch: {
        division: beforeState.division,
        tier: beforeState.tier,
        elitePoints: beforeState.elitePoints
      },
      leagueAfterMatch: {
        division: afterState.division,
        tier: afterState.tier,
        elitePoints: afterState.elitePoints
      }
    };
    
    console.log(`Generated match ${i+1}/${matchPath.length-1} with league impact:`, 
      `${beforeState.division} ${beforeState.tier} → ${afterState.division} ${afterState.tier}`);
    
    generatedHistory.push(match);
  }
  
  // Sort by date (newest first)
  return generatedHistory.sort((a, b) => 
    new Date(b.endDate).getTime() - new Date(a.endDate).getTime()
  );
};
