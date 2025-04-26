
import React, { useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import ClubDetailContent from './club/detail/ClubDetailContent';
import LoadingState from './club/detail/states/LoadingState';
import ErrorState from './club/detail/states/ErrorState';

const ClubDetail: React.FC = () => {
  const { selectedClub } = useApp();
  
  useEffect(() => {
    console.log('ClubDetail rendering with selectedClub:', selectedClub);
  }, [selectedClub]);

  if (!selectedClub) {
    return <LoadingState />;
  }
  
  // Make sure selectedClub has required properties to avoid errors
  if (!selectedClub.id || !selectedClub.name) {
    console.error('Invalid club data:', selectedClub);
    return <ErrorState message="Invalid club data" />;
  }

  // Ensure club.members exists to avoid errors
  const club = {
    ...selectedClub,
    members: selectedClub.members || []
  };

  return <ClubDetailContent club={club} />;
};

export default ClubDetail;
