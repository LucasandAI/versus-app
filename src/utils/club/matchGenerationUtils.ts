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
  
  // Start from Bronze 5 and work up to the club's current division
  let startingDivision: Division = 'Bronze';
  let startingTier = 5;
  let startingElitePoints = 0;
  
  const generatedHistory: Match[] = [];
  const matchCount = 7; // Generate a defined number of matches
  
  // Create a path to the current division and tier
  const neededMatches = [];
  let currentDivision = startingDivision;
  let currentTier = startingTier;
  let elitePoints = startingElitePoints;
  
  console.log(`Generating match history from ${currentDivision} ${currentTier} to ${club.division} ${club.tier}`);
  
  // Keep track of division/tier for each match
  let divisionPath = [{division: currentDivision, tier: currentTier, elitePoints}];
  
  // Build a path of wins that leads to the current division
  while (currentDivision !== club.division || currentTier !== club.tier) {
    // Determine if we need to win to progress toward target
    const needToWin = divisionOrder.indexOf(currentDivision) < divisionOrder.indexOf(club.division) || 
                     (currentDivision === club.division && currentTier > club.tier);
    
    // Add this match result to the path
    neededMatches.push(needToWin);
    
    // Calculate new division and tier after this match
    const result = calculateNewDivisionAndTier(currentDivision, currentTier, needToWin, elitePoints);
    
    // Update current state
    currentDivision = result.division;
    currentTier = result.tier;
    if (result.elitePoints !== undefined) elitePoints = result.elitePoints;
    
    // Add to the path
    divisionPath.push({division: currentDivision, tier: currentTier, elitePoints});
    
    // Safety check to avoid infinite loops
    if (neededMatches.length > 25) {
      console.log("Safety break - too many matches needed");
      break;
    }
  }

  // Log the generated path
  console.log("Division path:", divisionPath);
  
  // Limit to the desired number of matches, but ensure we have at least one
  const matchesToGenerate = Math.min(Math.max(neededMatches.length, 1), matchCount);
  
  // Generate the final matches based on the path
  for (let i = 0; i < matchesToGenerate; i++) {
    // Determine if this match was a win
    const isWin = i < neededMatches.length ? neededMatches[i] : Math.random() > 0.4;
    
    // Get division information before and after the match
    const beforeState = divisionPath[i];
    const afterState = divisionPath[i + 1] || beforeState;
    
    // Generate match details
    const opponentName = OPPONENTS[Math.floor(Math.random() * OPPONENTS.length)];
    const isHomeTeam = i % 2 === 0; // Alternate home/away
    
    // Calculate days ago for this match
    const daysAgo = (matchesToGenerate - i) * 7; // One match per week
    const endDate = generatePastDate(daysAgo);
    const startDate = new Date(endDate);
    startDate.setDate(endDate.getDate() - 7);
    
    // Generate distances - winners have higher distances
    const baseDistance = 150 + Math.random() * 50;
    const homeDistance = isWin === isHomeTeam 
      ? baseDistance * (1.05 + Math.random() * 0.15) 
      : baseDistance * (0.85 + Math.random() * 0.10);
    
    const awayDistance = isWin !== isHomeTeam 
      ? baseDistance * (1.05 + Math.random() * 0.15) 
      : baseDistance * (0.85 + Math.random() * 0.10);
    
    // Generate members
    const memberCount = club.members?.length || 3;
    const homeMemberDistances = isHomeTeam 
      ? generateMemberDistances(memberCount, homeDistance)
      : generateOpponentMembers(Math.floor(Math.random() * 2) + 3, homeDistance, opponentName);
    
    const awayMemberDistances = !isHomeTeam 
      ? generateMemberDistances(memberCount, awayDistance)
      : generateOpponentMembers(Math.floor(Math.random() * 2) + 3, awayDistance, opponentName);
    
    // Create the match object
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
      leagueAfterMatch: {
        division: afterState.division,
        tier: afterState.tier,
        elitePoints: afterState.elitePoints
      }
    };
    
    // Add to our list of matches
    generatedHistory.push(match);
  }
  
  // Sort matches by end date (most recent first)
  return generatedHistory.sort((a, b) => 
    new Date(b.endDate).getTime() - new Date(a.endDate).getTime()
  );
};
