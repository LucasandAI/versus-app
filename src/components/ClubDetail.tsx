
import React, { useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import ClubDetailContent from './club/detail/ClubDetailContent';
import GoBackHome from './shared/GoBackHome';
import { generateMatchHistoryFromDivision } from '@/utils/club/matchGenerationUtils';
import { syncClubDivisionWithMatchHistory } from '@/utils/club/matchSyncUtils';

const ClubDetail: React.FC = () => {
  const { selectedClub, setSelectedClub, currentUser, setCurrentUser } = useApp();
  
  useEffect(() => {
    if (selectedClub) {
      console.log("Rebuilding match history for club...");
      
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
      
      // Calculate win/loss record for logging
      const wins = syncedClub.matchHistory?.filter(match => {
        const isHome = match.homeClub.id === syncedClub.id;
        return (isHome && match.winner === 'home') || (!isHome && match.winner === 'away');
      }).length || 0;
      
      const losses = (syncedClub.matchHistory?.length || 0) - wins;
      console.log(`Win/Loss record: ${wins}W - ${losses}L`);
      
      // Update both selectedClub and currentUser
      setSelectedClub(syncedClub);
      
      // Update the club in currentUser's clubs array
      if (currentUser) {
        const updatedClubs = currentUser.clubs.map(club => 
          club.id === syncedClub.id ? syncedClub : club
        );
        
        setCurrentUser(prev => prev ? {
          ...prev,
          clubs: updatedClubs
        } : prev);
      }
    }
  }, [selectedClub?.id]); // Only run when the club ID changes

  if (!selectedClub) {
    return <GoBackHome />;
  }

  return <ClubDetailContent club={selectedClub} />;
};

export default ClubDetail;
