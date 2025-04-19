
import { Club } from '@/types';
import { generateMatchHistoryFromDivision } from './matchGenerationUtils';
import { syncClubDivisionWithMatchHistory } from './matchSyncUtils';

export const ensureClubHasProperMatchHistory = (club: Club): Club => {
  if (!club.matchHistory || club.matchHistory.length === 0) {
    const history = generateMatchHistoryFromDivision(club);
    const clubWithHistory = {
      ...club,
      matchHistory: history
    };
    
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
    
    return syncClubDivisionWithMatchHistory(clubWithRegeneratedHistory);
  }
  
  return club;
};

export { syncClubDivisionWithMatchHistory } from './matchSyncUtils';
export { generateMatchHistoryFromDivision } from './matchGenerationUtils';
export { generateMemberDistances } from './memberDistanceUtils';

