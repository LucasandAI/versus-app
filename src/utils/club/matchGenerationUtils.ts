
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
  if (!club.division || !club.tier) return [];

  console.log(`Starting match generation for ${club.name} (${club.division} ${club.tier})`);

  const divisionOrder: Division[] = ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond', 'Elite'];
  
  // Define starting point for match history
  const startingDivision = 'Bronze' as Division;
  const startingTier = 5;
  const startingElitePoints = 0;
  
  const generatedHistory: Match[] = [];
  const matchCount = 19; // Increased number of matches for more history
  
  const neededMatches = [];
  let currentDivision = startingDivision;
  let currentTier = startingTier;
  let elitePoints = startingElitePoints;
  
  console.log(`Generating match history from ${currentDivision} ${currentTier} to ${club.division} ${club.tier}`);
  
  let divisionPath: Array<{division: Division; tier: number; elitePoints: number}> = [
    {division: currentDivision, tier: currentTier, elitePoints}
  ];
  
  // Generate the path from starting division to current club division
  while (currentDivision !== club.division || currentTier !== club.tier) {
    const needToWin = divisionOrder.indexOf(currentDivision) < divisionOrder.indexOf(club.division) || 
                     (currentDivision === club.division && currentTier > club.tier);
    
    neededMatches.push(needToWin);
    
    const result = calculateNewDivisionAndTier(currentDivision, currentTier, needToWin, elitePoints);
    
    currentDivision = result.division;
    currentTier = result.tier;
    if (result.elitePoints !== undefined) elitePoints = result.elitePoints;
    
    divisionPath.push({division: currentDivision, tier: currentTier, elitePoints});
    
    if (neededMatches.length > 50) { // Increased safety limit
      console.log("Safety break - too many matches needed");
      break;
    }
  }

  // Add some extra matches after reaching current division (with random outcomes)
  const extraMatches = Math.max(0, matchCount - neededMatches.length);
  for (let i = 0; i < extraMatches; i++) {
    const randomWin = Math.random() > 0.4; // 60% chance of winning
    const result = calculateNewDivisionAndTier(currentDivision, currentTier, randomWin, elitePoints);
    
    currentDivision = result.division;
    currentTier = result.tier;
    if (result.elitePoints !== undefined) elitePoints = result.elitePoints;
    
    neededMatches.push(randomWin);
    divisionPath.push({division: currentDivision, tier: currentTier, elitePoints});
  }

  console.log("Division path:", divisionPath);
  
  const matchesToGenerate = Math.min(Math.max(neededMatches.length, 1), matchCount);
  console.log(`Generating ${matchesToGenerate} matches`);
  
  // Generate each match
  for (let i = 0; i < matchesToGenerate; i++) {
    const isWin = i < neededMatches.length ? neededMatches[i] : Math.random() > 0.4;
    const beforeState = divisionPath[i];
    const afterState = divisionPath[i + 1] || beforeState;
    
    const opponentName = OPPONENTS[Math.floor(Math.random() * OPPONENTS.length)];
    const isHomeTeam = i % 2 === 0;
    
    // Generate date ranges (more varied)
    const daysAgo = Math.floor((matchesToGenerate - i) * (7 + Math.random() * 3));
    const endDate = generatePastDate(daysAgo);
    const startDate = new Date(endDate);
    startDate.setDate(endDate.getDate() - 7);
    
    // Generate distances with more variance
    const baseDistance = 150 + Math.random() * 150;
    const winnerMultiplier = 1.05 + Math.random() * 0.3;
    const loserMultiplier = 0.7 + Math.random() * 0.25;
    
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
    
    // Create match with clear league impact data
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
    
    console.log(`Generated match ${i+1}/${matchesToGenerate} with league impact:`, match.leagueAfterMatch);
    generatedHistory.push(match);
  }
  
  // Sort by date (newest first)
  return generatedHistory.sort((a, b) => 
    new Date(b.endDate).getTime() - new Date(a.endDate).getTime()
  );
};
