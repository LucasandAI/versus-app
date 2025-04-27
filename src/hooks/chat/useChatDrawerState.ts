
import { useState, useEffect } from 'react';
import { Club } from '@/types';

export const useChatDrawerState = (open: boolean) => {
  const [selectedLocalClub, setSelectedLocalClub] = useState<Club | null>(null);

  const handleSelectClub = (club: Club) => {
    setSelectedLocalClub(club);
  };

  return {
    selectedLocalClub,
    handleSelectClub
  };
};
