
import React from 'react';
import { useApp } from '@/context/AppContext';
import ClubDetailContent from './club/detail/ClubDetailContent';
import LoadingState from './club/detail/states/LoadingState';
import ErrorState from './club/detail/states/ErrorState';
import { useClubData } from '@/hooks/club/useClubData';

const ClubDetail: React.FC = () => {
  const { selectedClub } = useApp();
  const { club, isLoading, error } = useClubData(selectedClub?.id);

  if (isLoading) {
    return <LoadingState />;
  }

  if (error || !club) {
    return <ErrorState />;
  }

  return <ClubDetailContent club={club} />;
};

export default ClubDetail;
