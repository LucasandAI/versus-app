
import React, { useEffect, useState } from 'react';
import { useApp } from '@/context/AppContext';
import ClubDetailContent from './club/detail/ClubDetailContent';
import LoadingState from './club/detail/states/LoadingState';
import ErrorState from './club/detail/states/ErrorState';
import { useClubData } from '@/hooks/club/useClubData';

const ClubDetail: React.FC = () => {
  const { selectedClub, refreshCurrentUser } = useApp();
  const [clubId, setClubId] = useState<string | undefined>(undefined);
  
  // Enhanced logging for debugging
  useEffect(() => {
    console.log('[ClubDetail] Component mounted/updated');
    console.log('[ClubDetail] selectedClub state:', selectedClub);
  }, [selectedClub]);
  
  // Only set clubId in state once we have a valid selectedClub.id
  useEffect(() => {
    if (selectedClub?.id) {
      console.log('[ClubDetail] Setting club ID to:', selectedClub.id);
      setClubId(selectedClub.id);
    }
  }, [selectedClub]);

  // Now only call useClubData with a valid clubId
  const { club, isLoading, error, refetchClub } = useClubData(clubId);

  // Effect to refetch club data when selectedClub changes
  useEffect(() => {
    if (selectedClub && clubId && refetchClub) {
      console.log('[ClubDetail] Selected club updated, refetching data');
      refetchClub();
    }
  }, [selectedClub, refetchClub, clubId]);

  if (!clubId) {
    console.log('[ClubDetail] No clubId yet, showing loading state');
    return <LoadingState />;
  }

  if (isLoading) {
    console.log('[ClubDetail] Club data is loading');
    return <LoadingState />;
  }

  if (error || !club) {
    console.error('[ClubDetail] Error loading club:', error);
    return <ErrorState />;
  }

  console.log('[ClubDetail] Rendering club content with data:', club);
  return <ClubDetailContent club={club} />;
};

export default ClubDetail;
