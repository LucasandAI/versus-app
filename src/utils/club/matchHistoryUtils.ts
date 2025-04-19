
export { syncClubDivisionWithMatchHistory } from './matchSyncUtils';
export { generateMatchHistoryFromDivision } from './matchGenerationUtils';
export { generateMemberDistances } from './memberDistanceUtils';

import { Club } from '@/types';
import { generateMatchHistoryFromDivision } from './matchGenerationUtils';

// Function to ensure a club has proper match history
export const ensureClubHasProperMatchHistory = (club: Club): Club => {
  console.log("Ensuring club has proper match history. Current history:", club.matchHistory?.length || 0);
  
  // If the club already has enough match history, return it unchanged
  if (club.matchHistory && club.matchHistory.length >= 10) {
    console.log("Club already has enough match history");
    return club;
  }
  
  // Generate match history based on the club's current division and tier
  console.log(`Generating match history for ${club.name} (${club.division} ${club.tier})`);
  const matchHistory = generateMatchHistoryFromDivision(club);
  console.log(`Generated ${matchHistory.length} matches with league impact:`, 
    matchHistory.length > 0 ? matchHistory[0].leagueAfterMatch : 'none');
  
  // Return updated club with match history
  return {
    ...club,
    matchHistory: matchHistory
  };
};
