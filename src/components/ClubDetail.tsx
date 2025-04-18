
import React from 'react';
import { useApp } from '@/context/AppContext';
import ClubDetailContent from './club/detail/ClubDetailContent';
import GoBackHome from './shared/GoBackHome';

const ClubDetail: React.FC = () => {
  const { selectedClub } = useApp();
  
  // Debug the selected club
  console.log('Selected club in ClubDetail:', selectedClub);

  if (!selectedClub) {
    return <GoBackHome />;
  }

  return <ClubDetailContent club={selectedClub} />;
};

export default ClubDetail;
