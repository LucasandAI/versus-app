
import { Club, Match, ClubMember, Division } from '@/types';
import { calculateNewDivisionAndTier } from './leagueUtils';

export const syncClubDivisionWithMatchHistory = (club: Club): Club => {
  if (!club.matchHistory || club.matchHistory.length === 0) {
    return club;
  }

  const sortedHistory = [...club.matchHistory].sort((a, b) => 
    new Date(b.endDate).getTime() - new Date(a.endDate).getTime()
  );

  const latestMatch = sortedHistory[0];
  
  if (latestMatch.leagueAfterMatch) {
    return {
      ...club,
      division: latestMatch.leagueAfterMatch.division,
      tier: latestMatch.leagueAfterMatch.tier
    };
  }

  const isHomeTeam = latestMatch.homeClub.id === club.id;
  const weWon = (isHomeTeam && latestMatch.winner === 'home') || (!isHomeTeam && latestMatch.winner === 'away');
  
  const newDivisionAndTier = calculateNewDivisionAndTier(club.division, club.tier, weWon);
  
  return {
    ...club,
    division: newDivisionAndTier.division,
    tier: newDivisionAndTier.tier
  };
};

const generateMemberDistances = (members: ClubMember[], totalDistance: number): ClubMember[] => {
  if (!members.length) {
    return [];
  }
  
  let remaining = totalDistance;
  return members.map((member, index) => {
    if (index === members.length - 1) {
      return { ...member, distanceContribution: parseFloat(remaining.toFixed(1)) };
    }
    
    const contribution = parseFloat((Math.random() * (remaining * 0.6)).toFixed(1));
    remaining -= contribution;
    return { ...member, distanceContribution: contribution };
  });
};

export const generateMatchHistoryFromDivision = (club: Club): Match[] => {
  if (!club.division || !club.tier) {
    return [];
  }

  const divisionOrder: Division[] = ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond', 'Elite'];
  
  // Target state that we're building history up to
  const targetState = {
    division: club.division,
    tier: club.tier
  };
  
  // Always start from Bronze 5
  let divisionIndex = 0;
  let tier = 5;
  
  const generatedHistory: Match[] = [];
  const opponents = ['Weekend Warriors', 'Road Runners', 'Sprint Squad', 'Hill Climbers', 
                     'Mountain Goats', 'Trail Blazers', 'Urban Pacers', 'Night Striders'];
  
  const generatePastDate = (daysAgo: number) => {
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    return date;
  };
  
  let matchIndex = 0;
  
  // Generate matches until we reach the target division and tier
  while (
    divisionOrder[divisionIndex] !== targetState.division || 
    tier !== targetState.tier
  ) {
    // For normal progression, we'll use mostly wins (80% chance)
    const isWin = Math.random() < 0.8;
    const nextState = calculateNewDivisionAndTier(divisionOrder[divisionIndex], tier, isWin);
    
    // If we lose and would go backwards, sometimes skip this match to ensure progression
    if (!isWin && (nextState.division !== divisionOrder[divisionIndex] || nextState.tier > tier)) {
      if (Math.random() < 0.5) continue; // 50% chance to retry for a win instead
    }
    
    const opponentName = opponents[Math.floor(Math.random() * opponents.length)];
    const homeDistance = parseFloat((Math.random() * 100 + 150).toFixed(1));
    const awayDistance = isWin ? 
      parseFloat((homeDistance * (0.6 + Math.random() * 0.2)).toFixed(1)) :
      parseFloat((homeDistance * (1.1 + Math.random() * 0.3)).toFixed(1));
    
    const isHomeTeam = matchIndex % 2 === 0;
    
    // Calculate date - earliest matches are further in the past
    // More days in the past for earlier divisions
    const divisionFactor = (5 - divisionIndex) * 30; // Each division is about a month
    const tierFactor = tier * 7; // Each tier is about a week
    const daysAgo = divisionFactor + tierFactor + matchIndex * 3; // 2-3 matches per week
    
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
        members: []
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
        members: []
      },
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      status: 'completed',
      winner: isWin ? (isHomeTeam ? 'home' : 'away') : (isHomeTeam ? 'away' : 'home'),
      leagueAfterMatch: {
        division: nextState.division,
        tier: nextState.tier
      }
    };
    
    // Generate opponent members with better distribution (1 star, some mid-range, 1 low performer)
    const opponentClub = isHomeTeam ? match.awayClub : match.homeClub;
    const opponentMemberCount = Math.floor(Math.random() * 3) + 3; // 3-5 members
    const opponentDistance = opponentClub.totalDistance;
    
    // Create more realistic opponent members
    const opponentMembers: ClubMember[] = [];
    let remainingDistance = opponentDistance;
    
    // First add a star performer (30-40% of total)
    const starPerformerPercent = 0.3 + Math.random() * 0.1;
    const starDistance = parseFloat((opponentDistance * starPerformerPercent).toFixed(1));
    remainingDistance -= starDistance;
    
    opponentMembers.push({
      id: `opponent-${matchIndex}-star`,
      name: `${opponentName} Captain`,
      avatar: '/placeholder.svg',
      isAdmin: true,
      distanceContribution: starDistance
    });
    
    // Then add middle performers
    for (let i = 0; i < opponentMemberCount - 2; i++) {
      const midPerformerPercent = (0.15 + Math.random() * 0.1) * (opponentMemberCount - 2);
      const midDistance = parseFloat((remainingDistance / midPerformerPercent).toFixed(1));
      remainingDistance -= midDistance;
      
      opponentMembers.push({
        id: `opponent-${matchIndex}-mid-${i}`,
        name: `${opponentName} Runner ${i + 1}`,
        avatar: '/placeholder.svg',
        isAdmin: false,
        distanceContribution: midDistance
      });
    }
    
    // Finally add one low performer with remaining distance
    opponentMembers.push({
      id: `opponent-${matchIndex}-low`,
      name: `${opponentName} Newcomer`,
      avatar: '/placeholder.svg',
      isAdmin: false,
      distanceContribution: parseFloat(remainingDistance.toFixed(1))
    });
    
    opponentClub.members = opponentMembers;
    generatedHistory.push(match);
    
    // Update our position for the next iteration
    divisionIndex = divisionOrder.indexOf(nextState.division);
    tier = nextState.tier;
    matchIndex++;
    
    // Safety check to prevent infinite loops
    if (matchIndex >= 30) break;
  }
  
  // Sort by date, most recent first
  return generatedHistory.sort((a, b) => 
    new Date(b.endDate).getTime() - new Date(a.endDate).getTime()
  );
};

export const ensureClubHasProperMatchHistory = (club: Club): Club => {
  if (!club.matchHistory || club.matchHistory.length === 0) {
    const history = generateMatchHistoryFromDivision(club);
    const clubWithHistory = {
      ...club,
      matchHistory: history
    };
    
    // Sync division with the history we just generated
    return syncClubDivisionWithMatchHistory(clubWithHistory);
  }
  
  // Check if the latest match's division and tier match the club's current division and tier
  const latestMatch = [...club.matchHistory].sort((a, b) => 
    new Date(b.endDate).getTime() - new Date(a.endDate).getTime()
  )[0];
  
  if (!latestMatch.leagueAfterMatch || 
      latestMatch.leagueAfterMatch.division !== club.division || 
      latestMatch.leagueAfterMatch.tier !== club.tier) {
    
    const regeneratedHistory = generateMatchHistoryFromDivision(club);
    const clubWithRegeneratedHistory = {
      ...club,
      matchHistory: regeneratedHistory
    };
    
    // After regenerating history, make sure to sync the club's division
    return syncClubDivisionWithMatchHistory(clubWithRegeneratedHistory);
  }
  
  return club;
};
