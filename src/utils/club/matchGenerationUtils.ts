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
  
  const startingDivision = 'Bronze' as Division;
  let startingTier = 5;
  let startingElitePoints = 0;
  
  const generatedHistory: Match[] = [];
  const matchCount = 10;
  
  const neededMatches = [];
  let currentDivision = startingDivision;
  let currentTier = startingTier;
  let elitePoints = startingElitePoints;
  
  console.log(`Generating match history from ${currentDivision} ${currentTier} to ${club.division} ${club.tier}`);
  
  let divisionPath: Array<{division: Division; tier: number; elitePoints: number}> = [
    {division: currentDivision, tier: currentTier, elitePoints}
  ];
  
  while (currentDivision !== club.division || currentTier !== club.tier) {
    const needToWin = divisionOrder.indexOf(currentDivision) < divisionOrder.indexOf(club.division) || 
                     (currentDivision === club.division && currentTier > club.tier);
    
    neededMatches.push(needToWin);
    
    const result = calculateNewDivisionAndTier(currentDivision, currentTier, needToWin, elitePoints);
    
    currentDivision = result.division;
    currentTier = result.tier;
    if (result.elitePoints !== undefined) elitePoints = result.elitePoints;
    
    divisionPath.push({division: currentDivision, tier: currentTier, elitePoints});
    
    if (neededMatches.length > 25) {
      console.log("Safety break - too many matches needed");
      break;
    }
  }

  const extraMatches = Math.max(0, matchCount - neededMatches.length);
  for (let i = 0; i < extraMatches; i++) {
    const randomWin = Math.random() > 0.4;
    const result = calculateNewDivisionAndTier(currentDivision, currentTier, randomWin, elitePoints);
    
    currentDivision = result.division;
    currentTier = result.tier;
    if (result.elitePoints !== undefined) elitePoints = result.elitePoints;
    
    neededMatches.push(randomWin);
    divisionPath.push({division: currentDivision, tier: currentTier, elitePoints});
  }

  console.log("Division path:", divisionPath);
  
  const matchesToGenerate = Math.min(Math.max(neededMatches.length, 1), matchCount);
  
  for (let i = 0; i < matchesToGenerate; i++) {
    const isWin = i < neededMatches.length ? neededMatches[i] : Math.random() > 0.4;
    const beforeState = divisionPath[i];
    const afterState = divisionPath[i + 1] || beforeState;
    
    const opponentName = OPPONENTS[Math.floor(Math.random() * OPPONENTS.length)];
    const isHomeTeam = i % 2 === 0;
    
    const daysAgo = (matchesToGenerate - i) * 7;
    const endDate = generatePastDate(daysAgo);
    const startDate = new Date(endDate);
    startDate.setDate(endDate.getDate() - 7);
    
    const baseDistance = 150 + Math.random() * 100;
    const homeDistance = isWin === isHomeTeam 
      ? baseDistance * (1.1 + Math.random() * 0.2) 
      : baseDistance * (0.8 + Math.random() * 0.15);
    
    const awayDistance = isWin !== isHomeTeam 
      ? baseDistance * (1.1 + Math.random() * 0.2) 
      : baseDistance * (0.8 + Math.random() * 0.15);
    
    const memberCount = club.members?.length || 5;
    const homeMemberDistances = isHomeTeam 
      ? generateMemberDistances(memberCount, homeDistance)
      : generateOpponentMembers(Math.floor(Math.random() * 2) + 3, homeDistance, opponentName);
    
    const awayMemberDistances = !isHomeTeam 
      ? generateMemberDistances(memberCount, awayDistance)
      : generateOpponentMembers(Math.floor(Math.random() * 2) + 3, awayDistance, opponentName);
    
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
    
    generatedHistory.push(match);
  }
  
  return generatedHistory.sort((a, b) => 
    new Date(b.endDate).getTime() - new Date(a.endDate).getTime()
  );
};
