
import React, { useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import ClubDetailContent from './club/detail/ClubDetailContent';
import GoBackHome from './shared/GoBackHome';
import { syncClubDivisionWithMatchHistory } from '@/utils/club/matchSyncUtils';
import { generateMatchHistoryFromDivision } from '@/utils/club/matchGenerationUtils';

const ClubDetail: React.FC = () => {
  const { selectedClub, setSelectedClub } = useApp();
  
  console.log('Selected club in ClubDetail:', selectedClub);

  useEffect(() => {
    if (selectedClub) {
      console.log("Processing club match history in ClubDetail...");

      // Calculate minimum required matches based on division and tier
      const divisionOrder = ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond', 'Elite'];
      const currentDivisionIndex = divisionOrder.indexOf(selectedClub.division);
      const minRequiredMatches = (currentDivisionIndex * 5) + // Matches to climb divisions
                                (5 - (selectedClub.tier || 1)); // Matches within current division
      
      console.log("Minimum required matches:", minRequiredMatches);
      console.log("Current match count:", selectedClub.matchHistory?.length);

      // Check if history needs regeneration
      const clubNeedsHistoryFix = !selectedClub.matchHistory ||
        selectedClub.matchHistory.length < minRequiredMatches ||
        !selectedClub.matchHistory.some(m => 
          m.leagueAfterMatch?.division === selectedClub.division && 
          m.leagueAfterMatch?.tier === selectedClub.tier
        );
      
      console.log("Club needs history fix:", clubNeedsHistoryFix);
      
      // Regenerate history if needed
      const clubWithHistory = clubNeedsHistoryFix 
        ? {
            ...selectedClub,
            matchHistory: generateMatchHistoryFromDivision(selectedClub)
          }
        : selectedClub;
      
      // Sync club's division with match history
      const syncedClub = clubWithHistory.matchHistory?.length > 0 
        ? syncClubDivisionWithMatchHistory(clubWithHistory)
        : clubWithHistory;
      
      // Calculate win/loss record
      const wins = syncedClub.matchHistory?.filter(match => {
        const isHome = match.homeClub.id === syncedClub.id;
        return (isHome && match.winner === 'home') || (!isHome && match.winner === 'away');
      }).length || 0;
      
      const losses = (syncedClub.matchHistory?.length || 0) - wins;
      
      console.log(`Win/Loss record: ${wins}W - ${losses}L`);
      
      // Update if changes were made
      if (JSON.stringify(syncedClub) !== JSON.stringify(selectedClub)) {
        console.log('Updating club with new match history:', 
          `${selectedClub.division} ${selectedClub.tier}`, 'to', 
          `${syncedClub.division} ${syncedClub.tier}`,
          'with match count:', syncedClub.matchHistory?.length
        );
        setSelectedClub(syncedClub);
      }
    }
  }, [selectedClub?.id]);

  if (!selectedClub) {
    return <GoBackHome />;
  }

  return <ClubDetailContent club={selectedClub} />;
};

export default ClubDetail;
