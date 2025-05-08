
import { useState, useEffect, useRef } from 'react';
import { useApp } from '@/context/AppContext';
import { useFetchUserClubs } from '@/components/profile/hooks/userProfile/useFetchUserClubs';
import { useUnreadMessages } from '@/context/UnreadMessagesContext';
import { useDirectConversationsContext } from '@/context/DirectConversationsContext';
import { refreshNotifications } from '@/lib/notificationUtils';
import { supabase } from '@/integrations/supabase/client';
import { useClubMessages } from '@/hooks/chat/useClubMessages';

export const useInitialAppLoad = () => {
  const [isAppReady, setIsAppReady] = useState(false);
  const { currentUser, isSessionReady } = useApp();
  const { fetchConversations } = useDirectConversationsContext();
  const { fetchUnreadCounts } = useUnreadMessages();
  const initialDataFetchedRef = useRef(false);
  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Skip if not authenticated or session not ready or already fetched
    if (!isSessionReady || !currentUser?.id || initialDataFetchedRef.current) return;

    const fetchInitialData = async () => {
      try {
        console.log('[useInitialAppLoad] Starting initial data load');
        
        // Step 1: Fetch user clubs
        console.log('[useInitialAppLoad] Fetching user clubs');
        const userClubs = await useFetchUserClubs(currentUser.id);
        
        // Step 2: Pre-fetch club messages in background for faster chat drawer open
        if (userClubs && userClubs.length > 0) {
          console.log('[useInitialAppLoad] Prefetching club messages');
          
          const clubIds = userClubs.map(club => club.id);
          await Promise.all([
            // Fetch last 10 messages for each club to prepopulate cache
            supabase
              .from('club_chat_messages')
              .select(`
                id, 
                message, 
                sender_id, 
                club_id, 
                timestamp,
                sender:sender_id (
                  id, 
                  name, 
                  avatar
                )
              `)
              .in('club_id', clubIds)
              .order('timestamp', { ascending: false })
              .limit(10)
              .then(({ data, error }) => {
                if (error) console.error('[useInitialAppLoad] Error prefetching club messages:', error);
                if (data) console.log(`[useInitialAppLoad] Prefetched ${data.length} club messages`);
              })
          ]);
        }
        
        // Step 3: Fetch conversations (only once)
        console.log('[useInitialAppLoad] Fetching DM conversations');
        await fetchConversations(true); // Force refresh to ensure data is loaded
        
        // Step 4: Fetch unread message counts
        console.log('[useInitialAppLoad] Fetching unread message counts');
        await fetchUnreadCounts();
        
        // Step 5: Fetch notifications
        console.log('[useInitialAppLoad] Fetching notifications');
        await refreshNotifications();
        
        // Mark as completed
        initialDataFetchedRef.current = true;
        console.log('[useInitialAppLoad] Initial data loading complete');
        setIsAppReady(true);
        
        // Clear timeout if it exists
        if (loadingTimeoutRef.current) {
          clearTimeout(loadingTimeoutRef.current);
          loadingTimeoutRef.current = null;
        }
      } catch (error) {
        console.error('[useInitialAppLoad] Error loading initial data:', error);
        // Even on error, set app as ready so user isn't stuck on loading screen
        setIsAppReady(true);
      }
    };

    // Start loading process
    fetchInitialData();

    // Timeout fallback to prevent users getting stuck on loading screen
    loadingTimeoutRef.current = setTimeout(() => {
      if (!isAppReady) {
        console.warn('[useInitialAppLoad] Loading timeout reached, forcing app ready');
        setIsAppReady(true);
      }
    }, 5000); // 5 seconds timeout

    return () => {
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
    };
  }, [isSessionReady, currentUser?.id, isAppReady, fetchConversations, fetchUnreadCounts]);

  return isAppReady;
};
