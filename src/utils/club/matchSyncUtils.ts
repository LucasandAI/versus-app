
import { Club } from '@/types';
import { calculateNewDivisionAndTier } from './leagueUtils';

export const syncClubDivisionWithMatchHistory = (club: Club): Club => {
  if (!club.matchHistory || club.matchHistory.length === 0) {
    return club;
  }

  // Log match history for debugging
  console.log("Syncing club division. Match history count:", club.matchHistory.length);
  
  const sortedHistory = [...club.matchHistory].sort((a, b) => 
    new Date(b.endDate).getTime() - new Date(a.endDate).getTime()
  );

  const latestMatch = sortedHistory[0];
  console.log("Latest match:", latestMatch);
  
  if (latestMatch.leagueAfterMatch) {
    console.log("Using leagueAfterMatch from latest match:", latestMatch.leagueAfterMatch);
    return {
      ...club,
      division: latestMatch.leagueAfterMatch.division,
      tier: latestMatch.leagueAfterMatch.tier,
      // Include elite points if available
      ...(latestMatch.leagueAfterMatch.elitePoints !== undefined && {
        elitePoints: latestMatch.leagueAfterMatch.elitePoints
      })
    };
  }

  // Fallback to calculating if leagueAfterMatch is missing
  console.log("No leagueAfterMatch data found, calculating...");
  
  const isHomeTeam = latestMatch.homeClub.id === club.id;
  const weWon = (isHomeTeam && latestMatch.winner === 'home') || (!isHomeTeam && latestMatch.winner === 'away');
  
  const newDivisionAndTier = calculateNewDivisionAndTier(club.division, club.tier, weWon);
  console.log("Calculated new division and tier:", newDivisionAndTier);
  
  return {
    ...club,
    division: newDivisionAndTier.division,
    tier: newDivisionAndTier.tier,
    // Include elite points if available
    ...(newDivisionAndTier.elitePoints !== undefined && {
      elitePoints: newDivisionAndTier.elitePoints
    })
  };
};
