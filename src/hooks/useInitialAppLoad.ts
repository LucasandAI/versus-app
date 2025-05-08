import { useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { Club } from '@/types';
import { supabase } from '@/lib/supabase';

export const useInitialAppLoad = () => {
  const { currentUser, isSessionReady, isAppReady, setIsAppReady } = useApp();

  useEffect(() => {
    const fetchInitialData = async () => {
      // Don't start fetching if we don't have a user or session isn't ready
      if (!currentUser || !isSessionReady) {
        console.log('[useInitialAppLoad] Waiting for user and session:', {
          hasUser: !!currentUser,
          isSessionReady
        });
        return;
      }

      // Don't fetch if app is already ready
      if (isAppReady) {
        console.log('[useInitialAppLoad] App already ready, skipping fetch');
        return;
      }

      try {
        console.log('[useInitialAppLoad] Starting initial data fetch...');
        
        // Fetch user clubs
        console.log('[useInitialAppLoad] Fetching user clubs...');
        const { data: clubsData } = await supabase
          .from('clubs')
          .select('*')
          .eq('user_id', currentUser.id);
        
        if (!clubsData) {
          console.error('[useInitialAppLoad] No clubs data found');
          setIsAppReady(true); // Still mark as ready to prevent getting stuck
          return;
        }

        // Fetch club messages with unread status
        console.log('[useInitialAppLoad] Fetching club messages...');
        const clubIds = clubsData.map((club: Club) => club.id);
        const { data: messagesData } = await supabase
          .from('club_chat_messages')
          .select(`
            *,
            club:club_id (
              id,
              name,
              avatar_url
            ),
            sender:user_id (
              id,
              username,
              avatar_url
            )
          `)
          .in('club_id', clubIds)
          .order('timestamp', { ascending: false })
          .limit(200);

        // Fetch direct conversations
        console.log('[useInitialAppLoad] Fetching direct conversations...');
        const { data: conversationsData } = await supabase
          .from('direct_conversations')
          .select(`
            *,
            other_user:other_user_id (
              id,
              username,
              avatar_url
            )
          `)
          .or(`user_id.eq.${currentUser.id},other_user_id.eq.${currentUser.id}`);

        // Fetch unread message counts
        console.log('[useInitialAppLoad] Fetching unread message counts...');
        const { data: unreadData } = await supabase
          .from('unread_messages')
          .select('*')
          .eq('user_id', currentUser.id);

        // Fetch notifications
        console.log('[useInitialAppLoad] Fetching notifications...');
        const { data: notificationsData } = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', currentUser.id)
          .order('created_at', { ascending: false })
          .limit(50);

        console.log('[useInitialAppLoad] Initial data fetch completed');
        setIsAppReady(true);
      } catch (error) {
        console.error('[useInitialAppLoad] Error fetching initial data:', error);
        // Still mark app as ready to prevent getting stuck
        setIsAppReady(true);
      }
    };

    // Set a timeout to prevent getting stuck on loading screen
    const timeoutId = setTimeout(() => {
      console.log('[useInitialAppLoad] Loading timeout reached, forcing app ready state');
      setIsAppReady(true);
    }, 5000);

    fetchInitialData();

    return () => {
      clearTimeout(timeoutId);
    };
  }, [currentUser, isSessionReady, setIsAppReady]); // Added isSessionReady to dependencies

  return isAppReady;
};
