
import React, { useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import ClubDetailContent from './club/detail/ClubDetailContent';
import LoadingState from './club/detail/states/LoadingState';
import ErrorState from './club/detail/states/ErrorState';
import { useClubData } from '@/hooks/club/useClubData';

const ClubDetail: React.FC = () => {
  const { selectedClub, refreshCurrentUser } = useApp();
  const { club, isLoading, error, refreshClubData } = useClubData(selectedClub?.id);

  // When the component mounts, refresh user data to ensure clubs list is up to date
  useEffect(() => {
    refreshCurrentUser();
  }, [refreshCurrentUser]);

  if (isLoading) {
    return <LoadingState />;
  }

  if (error || !club) {
    return <ErrorState />;
  }

  return <ClubDetailContent 
    club={club} 
    onClubUpdated={refreshClubData} 
  />;
};

export default ClubDetail;
