
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

  // Ensure club has valid members, matchHistory, and division properties
  const safeClub = {
    ...club,
    members: club.members || [],
    matchHistory: club.matchHistory || [],
    division: club.division || 'bronze', // Default division if undefined
    tier: club.tier || 5 // Default tier if undefined
  };

  return <ClubDetailContent club={safeClub} />;
};

export default ClubDetail;
