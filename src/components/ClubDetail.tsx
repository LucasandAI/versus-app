
import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useApp } from '@/context/AppContext';
import ClubDetailContent from './club/detail/ClubDetailContent';
import GoBackHome from './shared/GoBackHome';
import { generateMatchHistoryFromDivision } from '@/utils/club/matchGenerationUtils';
import { syncClubDivisionWithMatchHistory } from '@/utils/club/matchSyncUtils';
import { buildMinimalClub } from '@/utils/club/clubBuilder';

const ClubDetail: React.FC = () => {
  const { selectedClub, setSelectedClub, currentUser, setCurrentUser } = useApp();
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const setupClub = async () => {
      setIsLoading(true);
      
      // Extract clubId from URL path
      const clubId = location.pathname.split('/clubs/')[1];
      
      if (clubId && !selectedClub) {
        console.log("No selected club, building minimal club for:", clubId);
        
        // First check if it's one of the user's clubs
        const userClub = currentUser?.clubs.find(c => c.id === clubId);
        
        if (userClub) {
          console.log("Found club in user's clubs");
          setSelectedClub(userClub);
        } else {
          console.log("Building minimal club");
          // Create a minimal club if we don't have it
          const minimalClub = buildMinimalClub(clubId);
          setSelectedClub(minimalClub);
        }
      }
      
      setIsLoading(false);
    };
    
    setupClub();
  }, [location.pathname, selectedClub, currentUser]);
  
  useEffect(() => {
    if (selectedClub && (!selectedClub.matchHistory || selectedClub.matchHistory.length === 0)) {
      console.log("Generating new match history for club...");
      
      // Generate match history
      const newMatchHistory = generateMatchHistoryFromDivision(selectedClub);
      console.log("Generated new match history with", newMatchHistory.length, "matches");
      
      // Create updated club with new match history
      const clubWithHistory = {
        ...selectedClub,
        matchHistory: newMatchHistory
      };
      
      // Ensure the club's division is in sync with the match history
      const syncedClub = syncClubDivisionWithMatchHistory(clubWithHistory);
      
      // Update both selectedClub and currentUser if needed
      setSelectedClub(syncedClub);
      
      // If this is a user's club, update it in their clubs array
      if (currentUser && currentUser.clubs.some(c => c.id === syncedClub.id)) {
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

  // Only show GoBackHome if we have no clubId in the URL
  const clubId = location.pathname.split('/clubs/')[1];
  if (!clubId) {
    return <GoBackHome />;
  }

  // Show loading indicator while setting up the club
  if (isLoading) {
    return (
      <div className="container-mobile py-8 text-center">
        <p className="text-lg text-gray-600">Loading club details...</p>
      </div>
    );
  }

  return <ClubDetailContent club={selectedClub} />;
};

export default ClubDetail;
