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
  console.log(`Generating match history for ${club.name} (${club.division} ${club.tier || 1})`);

  // Define division progression path
  const divisionOrder: Division[] = ['bronze', 'silver', 'gold', 'platinum', 'diamond', 'elite'];
  
  // Always start from Bronze 5
  const startingDivision = 'bronze' as Division;
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
  
  // Generate the path of matches needed
  while (currentDivision !== club.division || currentTier !== (club.tier || 1)) {
    // For progression, we always need to win
    const needToWin = true;
    
    matchPath.push({
      needToWin,
      division: currentDivision,
      tier: currentTier,
      elitePoints: currentDivision === 'Elite' ? elitePoints : undefined
    });
    
    // Calculate next state based on a win
    if (currentTier === 1) {
      // Move to next division at tier 5 (or Elite tier 1)
      const currentDivIndex = divisionOrder.indexOf(currentDivision);
      if (currentDivIndex < divisionOrder.length - 1) {
        currentDivision = divisionOrder[currentDivIndex + 1];
        currentTier = currentDivision === 'Elite' ? 1 : 5;
        if (currentDivision === 'Elite') elitePoints = 0;
      }
    } else {
      // Move up one tier in same division
      currentTier--;
    }
    
    // Safety break
    if (matchPath.length > 30) break;
  }
  
  // Add final state
  matchPath.push({
    needToWin: true,
    division: club.division,
    tier: club.tier || 1,
    elitePoints: club.division === 'Elite' ? (club.elitePoints || 0) : undefined
  });
  
  console.log(`Generated path with ${matchPath.length} matches`);
  
  // Generate matches based on the path
  const matches: Match[] = [];
  
  for (let i = 0; i < matchPath.length - 1; i++) {
    const beforeState = matchPath[i];
    const afterState = matchPath[i + 1];
    
    // Generate match details
    const opponentName = OPPONENTS[Math.floor(Math.random() * OPPONENTS.length)];
    const isHomeTeam = i % 2 === 0;
    
    // Generate date for the match
    const totalMatches = matchPath.length - 1;
    const daysAgo = Math.floor((totalMatches - i) * (7 + Math.random() * 3));
    const endDate = generatePastDate(daysAgo);
    const startDate = new Date(endDate);
    startDate.setDate(endDate.getDate() - 7);
    
    // Generate distances ensuring winner has more distance
    const baseDistance = 150 + Math.random() * 150;
    const winnerDistance = baseDistance * (1.15 + Math.random() * 0.3);
    const loserDistance = baseDistance * (0.7 + Math.random() * 0.2);
    
    const ourDistance = isHomeTeam ? winnerDistance : loserDistance;
    const theirDistance = !isHomeTeam ? winnerDistance : loserDistance;
    
    // Use actual club members with generated distances
    const ourMembers = generateMemberDistances(club.members || [], ourDistance);
    const theirMembers = generateOpponentMembers(
      Math.floor(Math.random() * 3) + 3,
      theirDistance,
      opponentName
    );
    
    // Create the match object
    const match: Match = {
      id: `match-${club.id}-${i}`,
      homeClub: {
        id: isHomeTeam ? club.id : `opponent-${i}`,
        name: isHomeTeam ? club.name : opponentName,
        logo: isHomeTeam ? (club.logo || '/placeholder.svg') : '/placeholder.svg',
        totalDistance: parseFloat(ourDistance.toFixed(1)),
        members: isHomeTeam ? ourMembers : theirMembers
      },
      awayClub: {
        id: !isHomeTeam ? club.id : `opponent-${i}`,
        name: !isHomeTeam ? club.name : opponentName,
        logo: !isHomeTeam ? (club.logo || '/placeholder.svg') : '/placeholder.svg',
        totalDistance: parseFloat(theirDistance.toFixed(1)),
        members: !isHomeTeam ? ourMembers : theirMembers
      },
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      status: 'completed',
      winner: isHomeTeam ? 'home' : 'away',
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
    
    matches.push(match);
  }
  
  return matches.sort((a, b) => 
    new Date(b.endDate).getTime() - new Date(a.endDate).getTime()
  );
};
