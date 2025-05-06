
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { UserCache } from './types';

export const useUserData = () => {
  const [userCache, setUserCache] = useState<UserCache>({});

  const fetchUserData = useCallback(async (userId: string) => {
    try {
      const { data: userData, error } = await supabase
        .from('users')
        .select('name, avatar')
        .eq('id', userId)
        .single();

      if (error) throw error;

      if (userData) {
        setUserCache(prev => ({
          ...prev,
          [userId]: { name: userData.name, avatar: userData.avatar }
        }));
        return userData;
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  }, []);

  return { userCache, setUserCache, fetchUserData };
};
