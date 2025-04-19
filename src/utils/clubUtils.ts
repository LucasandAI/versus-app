
import { Club, Division, Match, ClubMember } from '@/types';
import { availableClubs } from '@/data/availableClubs';

export const MAX_CLUBS_PER_USER = 3;

export const findClubById = (clubId: string, allClubs: Club[]): Club | undefined => {
  return allClubs.find(club => club.id === clubId);
};

export const createNewClub = (clubId: string, clubName: string): Club => {
  return {
    id: clubId,
    name: clubName,
    logo: '/placeholder.svg',
    division: 'Bronze' as Division,
    tier: 3,
    members: [],
    currentMatch: null,
    matchHistory: []
  };
};

export const isUserClubMember = (club: Club, userId: string): boolean => {
  return club.members.some(member => member.id === userId);
};

export const getClubToJoin = (clubId: string, clubName: string, allClubs: Club[]): Club => {
  // Try to find the club in available clubs first
  const mockClub = availableClubs.find(club => club.id === clubId);
  let clubToJoin = findClubById(clubId, allClubs);

  if (!clubToJoin) {
    clubToJoin = mockClub ? 
      { ...createNewClub(mockClub.id, mockClub.name), division: mockClub.division as Division, tier: mockClub.tier } :
      createNewClub(clubId, clubName);
  }

  return clubToJoin;
};

// Sync club division with match history
export const syncClubDivisionWithMatchHistory = (club: Club): Club => {
  if (!club.matchHistory || club.matchHistory.length === 0) {
    // No match history, keep the current division
    return club;
  }

  // Sort match history by end date (newest first)
  const sortedHistory = [...club.matchHistory].sort((a, b) => 
    new Date(b.endDate).getTime() - new Date(a.endDate).getTime()
  );

  const latestMatch = sortedHistory[0];
  
  // If the latest match has leagueAfterMatch data, use it
  if (latestMatch.leagueAfterMatch) {
    return {
      ...club,
      division: latestMatch.leagueAfterMatch.division,
      tier: latestMatch.leagueAfterMatch.tier
    };
  }

  // Otherwise calculate it based on the match outcome
  const isHomeTeam = latestMatch.homeClub.id === club.id;
  const weWon = (isHomeTeam && latestMatch.winner === 'home') || (!isHomeTeam && latestMatch.winner === 'away');
  
  // Define the promotion/relegation logic
  const newDivisionAndTier = calculateNewDivisionAndTier(club.division, club.tier, weWon);
  
  return {
    ...club,
    division: newDivisionAndTier.division,
    tier: newDivisionAndTier.tier
  };
};

// Calculate new division and tier based on match outcome
export const calculateNewDivisionAndTier = (
  currentDivision: Division, 
  currentTier: number = 1, 
  isWin: boolean
): { division: Division; tier: number } => {
  // Division order from lowest to highest
  const divisionOrder: Division[] = ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond', 'Elite'];
  const currentDivisionIndex = divisionOrder.indexOf(currentDivision);
  
  if (isWin) {
    // Promotion logic
    if (currentDivision === 'Elite') {
      // Already at highest division
      return { division: 'Elite', tier: 1 };
    }
    
    if (currentTier === 1) {
      // Promote to next division, tier 1
      return { 
        division: divisionOrder[currentDivisionIndex + 1], 
        tier: 1 
      };
    } else {
      // Move up within the same division
      return { 
        division: currentDivision, 
        tier: currentTier - 1 
      };
    }
  } else {
    // Relegation logic
    if (currentDivision === 'Bronze' && currentTier === 5) {
      // Already at lowest division and tier
      return { division: 'Bronze', tier: 5 };
    }
    
    if (currentTier === 5 || (currentDivision === 'Elite' && currentTier === 1)) {
      // If already at tier 5 or Elite tier 1, relegate to previous division, tier 1
      return { 
        division: divisionOrder[Math.max(0, currentDivisionIndex - 1)], 
        tier: 1 
      };
    } else {
      // Move down within the same division
      return { 
        division: currentDivision, 
        tier: currentTier + 1 
      };
    }
  }
};

// Generate match history based on current division
export const generateMatchHistoryFromDivision = (club: Club): Match[] => {
  if (!club.division || !club.tier) {
    return [];
  }

  // Division order from lowest to highest
  const divisionOrder: Division[] = ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond', 'Elite'];
  const currentDivisionIndex = divisionOrder.indexOf(club.division);
  const currentTier = club.tier;
  
  // Start from Bronze 5 (lowest tier)
  let divisionIndex = 0; // Bronze
  let tier = 5;
  
  const generatedHistory: Match[] = [];
  const opponents = ['Weekend Warriors', 'Road Runners', 'Sprint Squad', 'Hill Climbers', 
                     'Mountain Goats', 'Trail Blazers', 'Urban Pacers', 'Night Striders'];
  
  // Generate random dates in the past (most recent first)
  const generatePastDate = (daysAgo: number) => {
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    return date;
  };
  
  // Generate random member distances
  const generateMemberDistances = (members: ClubMember[], totalDistance: number): ClubMember[] => {
    if (!members.length) {
      return [];
    }
    
    let remaining = totalDistance;
    return members.map((member, index) => {
      // Last member gets the remainder
      if (index === members.length - 1) {
        return { ...member, distanceContribution: parseFloat(remaining.toFixed(1)) };
      }
      
      // Otherwise distribute randomly
      const contribution = parseFloat((Math.random() * (remaining * 0.6)).toFixed(1));
      remaining -= contribution;
      return { ...member, distanceContribution: contribution };
    });
  };
  
  // Generate history entries until we reach current division and tier
  let matchIndex = 0;
  while (!(divisionIndex === currentDivisionIndex && tier === currentTier)) {
    // Decide if this match is a win (we need to win to progress)
    const isWin = true; // Always win to progress upwards
    
    // Calculate next division after this match
    const nextState = calculateNewDivisionAndTier(divisionOrder[divisionIndex], tier, isWin);
    
    // Generate opponent name
    const opponentName = opponents[Math.floor(Math.random() * opponents.length)];
    
    // Generate match distances
    const homeDistance = parseFloat((Math.random() * 100 + 150).toFixed(1));
    const awayDistance = isWin ? 
      parseFloat((homeDistance * (0.6 + Math.random() * 0.2)).toFixed(1)) :
      parseFloat((homeDistance * (1.1 + Math.random() * 0.3)).toFixed(1));
    
    // Decide if club is home or away (alternate)
    const isHomeTeam = matchIndex % 2 === 0;
    
    // Generate random dates (7 days per match)
    const endDate = generatePastDate(7 * (matchIndex + 1));
    const startDate = new Date(endDate);
    startDate.setDate(endDate.getDate() - 7);
    
    // Create match object
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
    
    // Add opponent members data
    const opponentClub = isHomeTeam ? match.awayClub : match.homeClub;
    const opponentMemberCount = Math.floor(Math.random() * 3) + 2; // 2-4 members
    const opponentDistance = opponentClub.totalDistance;
    opponentClub.members = Array.from({ length: opponentMemberCount }).map((_, i) => {
      const memberDistance = i === opponentMemberCount - 1 ? 
        opponentDistance / opponentMemberCount : 
        parseFloat((Math.random() * (opponentDistance / opponentMemberCount * 1.5)).toFixed(1));
      return {
        id: `opponent-${matchIndex}-member-${i}`,
        name: `Opponent Member ${i + 1}`,
        avatar: '/placeholder.svg',
        isAdmin: i === 0,
        distanceContribution: memberDistance
      };
    });
    
    // Add this match to history
    generatedHistory.push(match);
    
    // Update division and tier for next iteration
    divisionIndex = divisionOrder.indexOf(nextState.division);
    tier = nextState.tier;
    matchIndex++;
    
    // Safety check to prevent infinite loops (max 20 matches)
    if (matchIndex >= 20) break;
  }
  
  // Sort by date (most recent first)
  return generatedHistory.sort((a, b) => 
    new Date(b.endDate).getTime() - new Date(a.endDate).getTime()
  );
};

// Ensure a club has proper match history
export const ensureClubHasProperMatchHistory = (club: Club): Club => {
  if (!club.matchHistory || club.matchHistory.length === 0) {
    // Generate match history based on current division
    const history = generateMatchHistoryFromDivision(club);
    return {
      ...club,
      matchHistory: history
    };
  }
  
  // Check if the latest match's leagueAfterMatch matches current division
  const latestMatch = [...club.matchHistory].sort((a, b) => 
    new Date(b.endDate).getTime() - new Date(a.endDate).getTime()
  )[0];
  
  if (!latestMatch.leagueAfterMatch || 
      latestMatch.leagueAfterMatch.division !== club.division || 
      latestMatch.leagueAfterMatch.tier !== club.tier) {
    // If mismatch, regenerate match history
    return {
      ...club,
      matchHistory: generateMatchHistoryFromDivision(club)
    };
  }
  
  return club;
};
