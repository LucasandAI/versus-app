
import { Club, Match, Division } from '@/types';
import { generateMemberDistances } from './memberDistanceUtils';
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

  // Generate 10 matches with appropriate league progression
  for (let matchIndex = 0; matchIndex < 10; matchIndex++) {
    const isLastMatch = matchIndex === 9;
    
    // For the last match, ensure it results in the club's current division/tier
    let weWin = true;
    let nextState;
    
    if (isLastMatch) {
      // Ensure the final match results in the club's current division/tier
      nextState = {
        division: club.division,
        tier: club.tier
      };
      
      // Determine if the last match should be a win or loss
      const prevState = matchIndex > 0 ? 
        { 
          division: generatedHistory[matchIndex - 1].leagueAfterMatch!.division, 
          tier: generatedHistory[matchIndex - 1].leagueAfterMatch!.tier 
        } : 
        { division: 'Bronze' as Division, tier: 5 };
      
      // Check if winning would lead to current division/tier
      const ifWinState = calculateNewDivisionAndTier(prevState.division, prevState.tier, true);
      weWin = (ifWinState.division === club.division && ifWinState.tier === club.tier);
    } else {
      // For non-final matches, determine the next state based on winning
      nextState = calculateNewDivisionAndTier(divisionOrder[divisionIndex], tier, true);
      weWin = true;
    }

    const opponentName = OPPONENTS[Math.floor(Math.random() * OPPONENTS.length)];
    const homeDistance = parseFloat((Math.random() * 100 + 150).toFixed(1));
    const awayDistance = parseFloat((homeDistance * (0.6 + Math.random() * 0.2)).toFixed(1));
    const isHomeTeam = matchIndex % 2 === 0;
    
    // Ensure club's distance is higher if they win, lower if they lose
    let ourDistance, theirDistance;
    if (weWin) {
      ourDistance = Math.max(homeDistance, awayDistance);
      theirDistance = Math.min(homeDistance, awayDistance);
    } else {
      ourDistance = Math.min(homeDistance, awayDistance);
      theirDistance = Math.max(homeDistance, awayDistance);
    }
    
    const daysAgo = 7 * (10 - matchIndex); // Most recent matches are later in the array
    const endDate = generatePastDate(daysAgo);
    const startDate = new Date(endDate);
    startDate.setDate(endDate.getDate() - 7);

    // Create match object
    const match: Match = {
      id: `history-${club.id}-${matchIndex}`,
      homeClub: isHomeTeam ? {
        id: club.id,
        name: club.name,
        logo: club.logo,
        totalDistance: isHomeTeam ? ourDistance : theirDistance,
        members: isHomeTeam ? generateMemberDistances(club.members, ourDistance) : []
      } : {
        id: `opponent-${matchIndex}`,
        name: opponentName,
        logo: '/placeholder.svg',
        totalDistance: isHomeTeam ? theirDistance : ourDistance,
        members: []
      },
      awayClub: !isHomeTeam ? {
        id: club.id,
        name: club.name,
        logo: club.logo,
        totalDistance: !isHomeTeam ? ourDistance : theirDistance,
        members: !isHomeTeam ? generateMemberDistances(club.members, ourDistance) : []
      } : {
        id: `opponent-${matchIndex}`,
        name: opponentName,
        logo: '/placeholder.svg',
        totalDistance: !isHomeTeam ? theirDistance : ourDistance,
        members: []
      },
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      status: 'completed',
      // Set winner based on weWin flag
      winner: (isHomeTeam && weWin) || (!isHomeTeam && !weWin) ? 'home' : 'away',
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

    // Update for next match
    if (!isLastMatch) {
      divisionIndex = divisionOrder.indexOf(nextState.division);
      tier = nextState.tier;
    }
  }

  // Sort with most recent matches first
  return generatedHistory.sort((a, b) => new Date(b.endDate).getTime() - new Date(a.endDate).getTime());
};
