import { Club, Division } from '@/types';
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

// New function to sync club division with match history
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

// Helper function to calculate new division and tier based on match outcome
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
