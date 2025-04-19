
import React, { useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import ClubDetailContent from './club/detail/ClubDetailContent';
import GoBackHome from './shared/GoBackHome';
import { syncClubDivisionWithMatchHistory, ensureClubHasProperMatchHistory } from '@/utils/club/matchHistoryUtils';

const ClubDetail: React.FC = () => {
  const { selectedClub, setSelectedClub } = useApp();
  
  // Debug the selected club
  console.log('Selected club in ClubDetail:', selectedClub);

  // Ensure club has proper match history and sync club division with match history when component mounts
  useEffect(() => {
    if (selectedClub) {
      console.log("Processing club match history in ClubDetail...");
      
      // Check if we need to generate match history
      const needsHistory = !selectedClub.matchHistory || selectedClub.matchHistory.length < 10;
      
      // Only regenerate if needed
      const clubWithHistory = needsHistory 
        ? ensureClubHasProperMatchHistory({
            ...selectedClub,
            // Only clear existing match history if it needs regeneration
            matchHistory: []
          })
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
