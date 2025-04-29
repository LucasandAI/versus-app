
import { useState, useEffect, useRef } from 'react';
import { useApp } from '@/context/AppContext';
import { useFetchUserClubs } from '@/components/profile/hooks/userProfile/useFetchUserClubs';
import { useUnreadMessages } from '@/context/UnreadMessagesContext';
import { useDirectConversationsContext } from '@/context/DirectConversationsContext';

export const useInitialAppLoad = () => {
  const [isAppReady, setIsAppReady] = useState(false);
  const { currentUser, isSessionReady } = useApp();
  const { fetchConversations } = useDirectConversationsContext();
  const initialDataFetchedRef = useRef(false);

  useEffect(() => {
    // Skip if not authenticated or session not ready or already fetched
    if (!isSessionReady || !currentUser?.id || initialDataFetchedRef.current) return;

    const fetchInitialData = async () => {
      try {
        console.log('[useInitialAppLoad] Starting initial data load');
        
        // Step 1: Fetch user clubs
        console.log('[useInitialAppLoad] Fetching user clubs');
        await useFetchUserClubs(currentUser.id);
        
        // Step 2: Fetch conversations (only once)
        console.log('[useInitialAppLoad] Fetching DM conversations');
        await fetchConversations();
        
        // Mark as completed
        initialDataFetchedRef.current = true;
        console.log('[useInitialAppLoad] Initial data loading complete');
        setIsAppReady(true);
      } catch (error) {
        console.error('[useInitialAppLoad] Error loading initial data:', error);
        // Even on error, set app as ready so user isn't stuck on loading screen
        setIsAppReady(true);
      }
    };

    // Start loading process
    fetchInitialData();

    // Timeout fallback to prevent users getting stuck on loading screen
    const timeoutId = setTimeout(() => {
      if (!isAppReady) {
        console.warn('[useInitialAppLoad] Loading timeout reached, forcing app ready');
        setIsAppReady(true);
      }
    }, 5000);

    return () => clearTimeout(timeoutId);
  }, [isSessionReady, currentUser?.id, isAppReady, fetchConversations]);

  return isAppReady;
};
