
import React, { useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import ClubDetailContent from './club/detail/ClubDetailContent';
import GoBackHome from './shared/GoBackHome';
import { syncClubDivisionWithMatchHistory } from '@/utils/clubUtils';

const ClubDetail: React.FC = () => {
  const { selectedClub, setSelectedClub } = useApp();
  
  // Debug the selected club
  console.log('Selected club in ClubDetail:', selectedClub);

  // Sync club division with match history when component mounts
  useEffect(() => {
    if (selectedClub) {
      const syncedClub = syncClubDivisionWithMatchHistory(selectedClub);
      
      // Only update if something changed
      if (syncedClub.division !== selectedClub.division || syncedClub.tier !== selectedClub.tier) {
        console.log('Syncing club division from', 
          `${selectedClub.division} ${selectedClub.tier}`, 'to', 
          `${syncedClub.division} ${syncedClub.tier}`
        );
        setSelectedClub(syncedClub);
      }
    }
  }, [selectedClub?.id, selectedClub?.matchHistory.length]);

  if (!selectedClub) {
    return <GoBackHome />;
  }

  return <ClubDetailContent club={selectedClub} />;
};

export default ClubDetail;
