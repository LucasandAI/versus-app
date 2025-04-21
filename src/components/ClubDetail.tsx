
import React, { useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import ClubDetailContent from './club/detail/ClubDetailContent';
import GoBackHome from './shared/GoBackHome';
import { generateMatchHistoryFromDivision } from '@/utils/club/matchGenerationUtils';
import { syncClubDivisionWithMatchHistory } from '@/utils/club/matchSyncUtils';

const ClubDetail: React.FC = () => {
  const { selectedClub, setSelectedClub } = useApp();
  
  useEffect(() => {
    if (selectedClub) {
      // Always regenerate the match history for consistent experience
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
      
      // Calculate win/loss record
      const wins = syncedClub.matchHistory?.filter(match => {
        const isHome = match.homeClub.id === syncedClub.id;
        return (isHome && match.winner === 'home') || (!isHome && match.winner === 'away');
      }).length || 0;
      
      const losses = (syncedClub.matchHistory?.length || 0) - wins;
      
      console.log(`Win/Loss record: ${wins}W - ${losses}L`);
      console.log('Updating club with regenerated match history');
      
      setSelectedClub(syncedClub);
    }
  }, [selectedClub?.id]); // Only run when the club ID changes

  if (!selectedClub) {
    return <GoBackHome />;
  }

  return <ClubDetailContent club={selectedClub} />;
};

export default ClubDetail;
