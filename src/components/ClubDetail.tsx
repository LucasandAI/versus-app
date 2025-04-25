
import React, { useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import ClubDetailContent from './club/detail/ClubDetailContent';
import LoadingState from './club/detail/states/LoadingState';
import ErrorState from './club/detail/states/ErrorState';
import { useClubData } from '@/hooks/club/useClubData';

const ClubDetail: React.FC = () => {
  const { selectedClub, refreshCurrentUser } = useApp();
  const { club, isLoading, error, refetchClub } = useClubData(selectedClub?.id);

  // Effect to refetch club data when selectedClub changes
  useEffect(() => {
    if (selectedClub && refetchClub) {
      console.log('[ClubDetail] Selected club updated, refetching data');
      refetchClub();
    }
  }, [selectedClub, refetchClub]);

  if (isLoading) {
    return <LoadingState />;
  }

  if (error || !club) {
    return <ErrorState />;
  }

  return <ClubDetailContent club={club} />;
};

export default ClubDetail;
