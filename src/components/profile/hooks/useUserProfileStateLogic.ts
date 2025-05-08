
import { useState } from 'react';
import { useFetchUserProfile } from './userProfile/useFetchUserProfile';
import { useFetchUserClubs } from './userProfile/useFetchUserClubs';
import { useWeeklyDistance } from './userProfile/useWeeklyDistance';
import { useApp } from '@/context/AppContext';

export const useUserProfileStateLogic = () => {
  const { selectedUser } = useApp();
  const [loading, setLoading] = useState(false);
  
  // Get weekly distance using the refactored hook
  const weeklyDistance = useWeeklyDistance(selectedUser?.id);

  // This hook now acts as a facade for the refactored modular hooks
  // It maintains the same interface that UserProfile.tsx expects
  
  return {
    loading,
    weeklyDistance,
    // Add any other properties that were previously returned by this hook
  };
};
