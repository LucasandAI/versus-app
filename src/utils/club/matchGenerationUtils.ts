
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
  'Mountain Goats', 'Trail Blazers', 'Urban Pacers', 'Night Striders',
  'Marathon Masters', 'Peak Performers', 'Distance Demons', 'Endurance Elite'
];

export const generateMatchHistoryFromDivision = (club: Club): Match[] => {
  console.log(`Starting match generation for ${club.name} (${club.division} ${club.tier})`);

  // Define division progression path
  const divisionOrder: Division[] = ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond', 'Elite'];
  
  // Always start from Bronze 5
  const startingDivision = 'Bronze' as Division;
  const startingTier = 5;
  const startingElitePoints = 0;
  
  // Calculate how many matches are needed to reach current division/tier
  let requiredMatches: Array<{
    needToWin: boolean;
    beforeDivision: Division;
    beforeTier: number;
    beforeElitePoints: number;
    afterDivision: Division;
    afterTier: number;
    afterElitePoints: number;
  }> = [];
  
  let currentDivision = startingDivision;
  let currentTier = startingTier;
  let elitePoints = startingElitePoints;
  
  console.log(`Generating match history from ${currentDivision} ${currentTier} to ${club.division} ${club.tier}`);
  
  // Generate all necessary matches to reach current division/tier
  while (currentDivision !== club.division || currentTier !== (club.tier || 1)) {
    // Determine if we need to win to progress
    const needToWin = divisionOrder.indexOf(currentDivision) < divisionOrder.indexOf(club.division) || 
                     (currentDivision === club.division && currentTier > (club.tier || 1));
    
    // Store current state before match
    const beforeState = {
      beforeDivision: currentDivision,
      beforeTier: currentTier,
      beforeElitePoints: elitePoints
    };
    
    // Calculate new state after match
    const result = calculateNewDivisionAndTier(currentDivision, currentTier, needToWin, elitePoints);
    
    // Update current state
    currentDivision = result.division;
    currentTier = result.tier;
    if (result.elitePoints !== undefined) elitePoints = result.elitePoints;
    
    // Add match to required matches list
    requiredMatches.push({
      needToWin,
      ...beforeState,
      afterDivision: currentDivision,
      afterTier: currentTier,
      afterElitePoints: elitePoints
    });
    
    // Safety break to prevent infinite loop
    if (requiredMatches.length > 50) {
      console.log("Safety break - too many matches needed");
      break;
    }
  }
  
  console.log(`Required matches to reach ${club.division} ${club.tier || 1}: ${requiredMatches.length}`);
  
  // If no matches needed (already at starting division), generate at least one match
  if (requiredMatches.length === 0) {
    requiredMatches.push({
      needToWin: true,
      beforeDivision: currentDivision,
      beforeTier: currentTier,
      beforeElitePoints: elitePoints,
      afterDivision: currentDivision,
      afterTier: currentTier,
      afterElitePoints: elitePoints
    });
  }
  
  // Generate all matches
  const generatedHistory: Match[] = [];
  
  for (let i = 0; i < requiredMatches.length; i++) {
    const matchInfo = requiredMatches[i];
    const isWin = matchInfo.needToWin;
    
    // Opponent details
    const opponentName = OPPONENTS[Math.floor(Math.random() * OPPONENTS.length)];
    const isHomeTeam = i % 2 === 0;
    
    // Generate date ranges - older matches first
    const totalMatches = requiredMatches.length;
    const daysAgo = Math.floor((totalMatches - i) * (7 + Math.random() * 3));
    const endDate = generatePastDate(daysAgo);
    const startDate = new Date(endDate);
    startDate.setDate(endDate.getDate() - 7);
    
    // Generate distances ensuring winner has more distance
    const baseDistance = 150 + Math.random() * 150;
    const winnerMultiplier = 1.15 + Math.random() * 0.3;
    const loserMultiplier = 0.7 + Math.random() * 0.2;
    
    const homeDistance = isWin === isHomeTeam 
      ? baseDistance * winnerMultiplier 
      : baseDistance * loserMultiplier;
    
    const awayDistance = isWin !== isHomeTeam 
      ? baseDistance * winnerMultiplier 
      : baseDistance * loserMultiplier;
    
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
      winner: isWin ? (isHomeTeam ? 'home' : 'away') : (isHomeTeam ? 'away' : 'home'),
      leagueBeforeMatch: {
        division: matchInfo.beforeDivision,
        tier: matchInfo.beforeTier,
        elitePoints: matchInfo.beforeElitePoints
      },
      leagueAfterMatch: {
        division: matchInfo.afterDivision,
        tier: matchInfo.afterTier,
        elitePoints: matchInfo.afterElitePoints
      }
    };
    
    console.log(`Generated match ${i+1}/${requiredMatches.length} with league impact:`, 
      `${matchInfo.beforeDivision} ${matchInfo.beforeTier} → ${matchInfo.afterDivision} ${matchInfo.afterTier}`);
    
    generatedHistory.push(match);
  }
  
  // Sort by date (newest first)
  return generatedHistory.sort((a, b) => 
    new Date(b.endDate).getTime() - new Date(a.endDate).getTime()
  );
};
