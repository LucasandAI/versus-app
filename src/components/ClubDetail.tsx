
import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useApp } from '@/context/AppContext';
import ClubDetailContent from './club/detail/ClubDetailContent';
import GoBackHome from './shared/GoBackHome';
import { generateMatchHistoryFromDivision } from '@/utils/club/matchGenerationUtils';
import { syncClubDivisionWithMatchHistory } from '@/utils/club/matchSyncUtils';
import { Club } from '@/types';

const ClubDetail: React.FC = () => {
  const { id: clubId } = useParams();
  const { selectedClub, setSelectedClub, currentUser, setCurrentUser } = useApp();
  
  useEffect(() => {
    if (!selectedClub && clubId) {
      // Try to find the club in currentUser's clubs first
      const userClub = currentUser?.clubs.find(club => club.id === clubId);
      
      if (userClub) {
        setSelectedClub(userClub);
      } else {
        // Create a minimal club object for preview
        const previewClub: Club = {
          id: clubId,
          name: `Club ${clubId}`,
          logo: '/placeholder.svg',
          division: 'Bronze',
          tier: 5,
          members: [],
          matchHistory: []
        };
        
        // Generate match history for preview club
        const matchHistory = generateMatchHistoryFromDivision(previewClub);
        const clubWithHistory = {
          ...previewClub,
          matchHistory
        };
        
        // Ensure the club's division is in sync with the match history
        const syncedClub = syncClubDivisionWithMatchHistory(clubWithHistory);
        setSelectedClub(syncedClub);
      }
    }
  }, [clubId, selectedClub]);

  useEffect(() => {
    if (selectedClub && (!selectedClub.matchHistory || selectedClub.matchHistory.length === 0)) {
      console.log("Generating new match history for club...");
      
      const newMatchHistory = generateMatchHistoryFromDivision(selectedClub);
      console.log("Generated new match history with", newMatchHistory.length, "matches");
      
      const clubWithHistory = {
        ...selectedClub,
        matchHistory: newMatchHistory
      };
      
      const syncedClub = syncClubDivisionWithMatchHistory(clubWithHistory);
      setSelectedClub(syncedClub);
      
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
  }, [selectedClub?.id]);

  if (!selectedClub && !clubId) {
    return <GoBackHome />;
  }

  return selectedClub ? <ClubDetailContent club={selectedClub} /> : null;
};

export default ClubDetail;
