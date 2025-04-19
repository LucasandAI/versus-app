
export { syncClubDivisionWithMatchHistory } from './matchSyncUtils';
export { generateMatchHistoryFromDivision } from './matchGenerationUtils';
export { generateMemberDistances } from './memberDistanceUtils';

import { Club } from '@/types';
import { generateMatchHistoryFromDivision } from './matchGenerationUtils';

// Function to ensure a club has proper match history
export const ensureClubHasProperMatchHistory = (club: Club): Club => {
  // If the club already has enough match history, return it unchanged
  if (club.matchHistory && club.matchHistory.length >= 5) {
    return club;
  }
  
  // Generate match history based on the club's current division and tier
  const matchHistory = generateMatchHistoryFromDivision(club);
  
  // Return updated club with match history
  return {
    ...club,
    matchHistory: matchHistory
  };
};
