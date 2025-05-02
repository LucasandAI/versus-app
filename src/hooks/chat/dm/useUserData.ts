
import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { UserCache } from './types';

export const useUserData = () => {
  const [userCache, setUserCache] = useState<UserCache>({});
  const [fetchingUsers, setFetchingUsers] = useState<Set<string>>(new Set());

  // Callback to fetch user data
  const fetchUserData = useCallback(async (userId: string) => {
    // Skip if already fetching this user
    if (fetchingUsers.has(userId)) {
      console.log(`[useUserData] Already fetching user ${userId}`);
      return null;
    }
    
    try {
      setFetchingUsers(prev => {
        const updated = new Set(prev);
        updated.add(userId);
        return updated;
      });
      
      console.log(`[useUserData] Fetching user data for ${userId}`);
      
      const { data: userData, error } = await supabase
        .from('users')
        .select('name, avatar, bio')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('[useUserData] Error fetching user data:', error);
        return null;
      }

      if (userData) {
        const userWithDefaults = {
          name: userData.name || 'User',
          avatar: userData.avatar || '/placeholder.svg',
          bio: userData.bio || ''
        };
        
        console.log(`[useUserData] Fetched data for user ${userId}:`, userWithDefaults);
        
        setUserCache(prev => ({
          ...prev,
          [userId]: userWithDefaults
        }));
        
        return userWithDefaults;
      }
    } catch (error) {
      console.error('[useUserData] Exception fetching user data:', error);
      return null;
    } finally {
      setFetchingUsers(prev => {
        const updated = new Set(prev);
        updated.delete(userId);
        return updated;
      });
    }
  }, [fetchingUsers]);

  // Fetch any missing user data from stored conversations on mount
  useEffect(() => {
    const fetchStoredUsers = async () => {
      try {
        const conversationsString = localStorage.getItem('directConversations');
        if (!conversationsString) return;
        
        const conversations = JSON.parse(conversationsString);
        if (!Array.isArray(conversations)) return;
        
        const userIds = conversations.map(c => c.userId).filter(Boolean);
        
        for (const userId of userIds) {
          if (!userCache[userId] && !fetchingUsers.has(userId)) {
            fetchUserData(userId);
          }
        }
      } catch (error) {
        console.error('[useUserData] Error prefetching stored users:', error);
      }
    };
    
    fetchStoredUsers();
  }, [fetchUserData, userCache, fetchingUsers]);

  return { userCache, setUserCache, fetchUserData };
};
