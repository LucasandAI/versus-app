import React, { useEffect, useState } from 'react';
import { useApp } from '@/context/AppContext';
import ClubDetailContent from './club/detail/ClubDetailContent';
import GoBackHome from './shared/GoBackHome';
import { generateMatchHistoryFromDivision } from '@/utils/club/matchHistoryUtils';
import { syncClubDivisionWithMatchHistory } from '@/utils/club/matchSyncUtils';

const ClubDetail: React.FC = () => {
  const { selectedClub, setSelectedClub, currentUser, setCurrentUser } = useApp();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  useEffect(() => {
    if (selectedClub && (!selectedClub.matchHistory || selectedClub.matchHistory.length === 0)) {
      console.log("Generating new match history for club...");
      setIsLoading(true);
      
      try {
        const newMatchHistory = generateMatchHistoryFromDivision(selectedClub);
        console.log("Generated new match history with", newMatchHistory.length, "matches");
        
        const clubWithHistory = {
          ...selectedClub,
          matchHistory: newMatchHistory
        };
        
        const syncedClub = syncClubDivisionWithMatchHistory(clubWithHistory);
        
        setSelectedClub(syncedClub);
        
        if (currentUser && !syncedClub.isPreviewClub) {
          const isMember = currentUser.clubs.some(club => club.id === syncedClub.id);
          
          if (isMember) {
            const updatedClubs = currentUser.clubs.map(club => 
              club.id === syncedClub.id ? syncedClub : club
            );
            
            setCurrentUser(prev => prev ? {
              ...prev,
              clubs: updatedClubs
            } : prev);
          }
        }
      } catch (error) {
        console.error("Error generating match history:", error);
      } finally {
        setIsLoading(false);
      }
    }
  }, [selectedClub?.id]);

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading club details...</div>;
  }

  if (!selectedClub) {
    return <GoBackHome />;
  }

  return <ClubDetailContent club={selectedClub} />;
};

export default ClubDetail;
