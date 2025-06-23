
import { useState, useEffect, useRef } from 'react';
import { useApp } from '@/context/AppContext';
import { useFetchUserClubs } from '@/components/profile/hooks/userProfile/useFetchUserClubs';
import { useUnreadMessages } from '@/context/UnreadMessagesContext';
import { useDirectConversationsContext } from '@/context/DirectConversationsContext';
import { refreshNotifications } from '@/lib/notificationUtils';
import { supabase } from '@/integrations/supabase/client';
import { transformMatchData } from '@/utils/match/matchTransformUtils';

export const useInitialAppLoad = () => {
  const [isAppReady, setIsAppReady] = useState(false);
  const { currentUser, isSessionReady, setCurrentUser } = useApp();
  const { fetchConversations } = useDirectConversationsContext();
  const { fetchUnreadCounts } = useUnreadMessages();
  const initialDataFetchedRef = useRef(false);

  // Prefetch basic match data
  const prefetchMatchData = async (userClubs: any[]) => {
    if (!userClubs || userClubs.length === 0) return;
    
    try {
      console.log('[useInitialAppLoad] Prefetching match data');
      const clubIdsList = userClubs.map(club => club.id).filter(Boolean);
      
      if (clubIdsList.length === 0) return;
      
      // Lighter query for initial load - only essential fields
      const { data } = await supabase
        .from('view_full_match_info')
        .select(`
          match_id,
          status,
          start_date,
          end_date,
          home_club_id,
          away_club_id,
          home_club_name,
          away_club_name,
          home_club_logo,
          away_club_logo,
          home_club_division,
          away_club_division,
          home_club_tier,
          away_club_tier,
          home_total_distance,
          away_total_distance
        `)
        .or(clubIdsList.map(id => `home_club_id.eq.${id},away_club_id.eq.${id}`).join(','))
        .eq('status', 'active');

      if (data && data.length > 0) {
        // Pre-populate cache with lightweight match data
        data.forEach(match => {
          const userClubId = userClubs.find(club => 
            club.id === match.home_club_id || club.id === match.away_club_id
          )?.id || '';
          
          // Transform with minimal data for faster initial render
          transformMatchData({
            ...match,
            home_club_members: [],
            away_club_members: []
          }, userClubId);
        });
        
        console.log('[useInitialAppLoad] Match data prefetched and cached');
      }
    } catch (error) {
      console.error('[useInitialAppLoad] Error prefetching match data:', error);
      // Don't block app loading if match prefetch fails
    }
  };

  useEffect(() => {
    // Skip if not authenticated or session not ready or already fetched
    if (!isSessionReady || !currentUser?.id || initialDataFetchedRef.current) return;

    const fetchInitialData = async () => {
      try {
        console.log('[useInitialAppLoad] Starting initial data load');
        
        // Step 1: Fetch user clubs
        console.log('[useInitialAppLoad] Fetching user clubs');
        const userClubs = await useFetchUserClubs(currentUser.id);
        
        // Update current user with clubs immediately for UI
        if (userClubs && userClubs.length > 0) {
          setCurrentUser(prev => prev ? { ...prev, clubs: userClubs } : null);
        }
        
        // Step 2: Prefetch match data (non-blocking)
        prefetchMatchData(userClubs || []);
        
        // Step 3: Fetch conversations (only once)
        console.log('[useInitialAppLoad] Fetching DM conversations');
        await fetchConversations();

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
  }, [isSessionReady, currentUser?.id, isAppReady, fetchConversations, fetchUnreadCounts, setCurrentUser]);

  return isAppReady;
};
