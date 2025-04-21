
import React, { useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import ClubDetailContent from './club/detail/ClubDetailContent';
import GoBackHome from './shared/GoBackHome';
import { syncClubDivisionWithMatchHistory } from '@/utils/club/matchSyncUtils';
import { generateMatchHistoryFromDivision } from '@/utils/club/matchGenerationUtils';

const ClubDetail: React.FC = () => {
  const { selectedClub, setSelectedClub } = useApp();
  
  // Debug the selected club
  console.log('Selected club in ClubDetail:', selectedClub);

  // Ensure club has proper match history and sync club division with match history when component mounts
  useEffect(() => {
    if (selectedClub) {
      console.log("Processing club match history in ClubDetail...");
      
      // Check if we need to generate match history
      // Regenerate if there are fewer than needed matches or if last match doesn't have proper league data
      const hasValidHistory = selectedClub.matchHistory && 
                             selectedClub.matchHistory.length > 0 &&
                             selectedClub.matchHistory.some(m => 
                                m.leagueAfterMatch?.division === selectedClub.division && 
                                m.leagueAfterMatch?.tier === selectedClub.tier);
      
      // Only regenerate if needed
      const clubWithHistory = !hasValidHistory 
        ? {
            ...selectedClub,
            matchHistory: generateMatchHistoryFromDivision(selectedClub)
          }
        : selectedClub;
      
      // Then sync the club's division with match history if needed
      const syncedClub = clubWithHistory.matchHistory?.length > 0 
        ? syncClubDivisionWithMatchHistory(clubWithHistory)
        : clubWithHistory;
      
      // Update if there are any changes
      if (JSON.stringify(syncedClub) !== JSON.stringify(selectedClub)) {
        console.log('Syncing club data:', 
          `${selectedClub.division} ${selectedClub.tier}`, 'to', 
          `${syncedClub.division} ${syncedClub.tier}`,
          'with match history count:', syncedClub.matchHistory?.length
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
