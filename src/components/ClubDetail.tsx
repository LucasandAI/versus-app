
import React, { useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import ClubDetailContent from './club/detail/ClubDetailContent';
import LoadingState from './club/detail/states/LoadingState';
import ErrorState from './club/detail/states/ErrorState';
import { useClubData } from '@/hooks/club/useClubData';

const ClubDetail: React.FC = () => {
  const { selectedClub } = useApp();
  const clubId = selectedClub?.id;
  const { club, isLoading, error, refetchClub } = useClubData(clubId);

  useEffect(() => {
    if (clubId) {
      console.log('[ClubDetail] Selected club ID:', clubId);
      refetchClub();
    }
  }, [clubId, refetchClub]);

  if (isLoading) {
    return <LoadingState />;
  }

  if (error || !club) {
    console.error('[ClubDetail] Error loading club:', error);
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

  console.log('[ClubDetail] Rendering with club data:', safeClub);
  return <ClubDetailContent club={safeClub} />;
};

export default ClubDetail;
