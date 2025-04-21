
import React, { useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import ClubDetailContent from './club/detail/ClubDetailContent';
import GoBackHome from './shared/GoBackHome';
import { generateMatchHistoryFromDivision } from '@/utils/club/matchGenerationUtils';
import { syncClubDivisionWithMatchHistory } from '@/utils/club/matchSyncUtils';

const ClubDetail: React.FC = () => {
  const { selectedClub, setSelectedClub, currentUser, setCurrentUser } = useApp();
  
  useEffect(() => {
    if (selectedClub && (!selectedClub.matchHistory || selectedClub.matchHistory.length === 0)) {
      console.log("Generating new match history for club...");
      
      // Generate a completely new match history
      const newMatchHistory = generateMatchHistoryFromDivision(selectedClub);
      console.log("Generated new match history with", newMatchHistory.length, "matches");
      
      // Create updated club with new match history
      const clubWithHistory = {
        ...selectedClub,
        matchHistory: newMatchHistory
      };
      
      // Ensure the club's division is in sync with the match history
      const syncedClub = syncClubDivisionWithMatchHistory(clubWithHistory);
      
      // Update both selectedClub and currentUser
      setSelectedClub(syncedClub);
      
      // Update the club in currentUser's clubs array if it's one of the user's clubs
      if (currentUser && currentUser.clubs) {
        const userHasClub = currentUser.clubs.some(club => club.id === syncedClub.id);
        
        if (userHasClub) {
          const updatedClubs = currentUser.clubs.map(club => 
            club.id === syncedClub.id ? syncedClub : club
          );
          
          setCurrentUser(prev => prev ? {
            ...prev,
            clubs: updatedClubs
          } : prev);
        }
      }
    }
  }, [selectedClub?.id]);

  if (!selectedClub) {
    return <GoBackHome />;
  }

  return <ClubDetailContent club={selectedClub} />;
};

export default ClubDetail;
