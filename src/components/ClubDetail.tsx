
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

      // Force regeneration of match history for every club to ensure coherence
      console.log("Forcing match history regeneration to ensure coherency");
      
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
      
      // Always update with new match history
      console.log('Updating club with regenerated match history:', 
        `${selectedClub.division} ${selectedClub.tier}`, 'to', 
        `${syncedClub.division} ${syncedClub.tier}`,
        'with match count:', syncedClub.matchHistory?.length
      );
      setSelectedClub(syncedClub);
    }
  }, [selectedClub?.id]);

  if (!selectedClub) {
    return <GoBackHome />;
  }

  return <ClubDetailContent club={selectedClub} />;
};

export default ClubDetail;
