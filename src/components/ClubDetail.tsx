
import React from 'react';
import { useApp } from '@/context/AppContext';
import ClubDetailContent from './club/detail/ClubDetailContent';
import LoadingState from './club/detail/states/LoadingState';
import ErrorState from './club/detail/states/ErrorState';

const ClubDetail: React.FC = () => {
  const { selectedClub } = useApp();

  if (!selectedClub) {
    return <LoadingState />;
  }

  // Check if club has all required essential properties to render properly
  if (!selectedClub.id || !selectedClub.name) {
    return <ErrorState message="Invalid club data received." />;
  }

  // Ensure members is defined to prevent crashes
  if (!selectedClub.members) {
    selectedClub.members = [];
  }

  return <ClubDetailContent club={selectedClub} />;
};

export default ClubDetail;
