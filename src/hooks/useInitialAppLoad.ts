import { useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { Club } from '@/types';
import { supabase } from '@/lib/supabase';

export const useInitialAppLoad = () => {
  const { currentUser, isAppReady, setIsAppReady } = useApp();

  useEffect(() => {
    const fetchInitialData = async () => {
      if (!currentUser || isAppReady) return;

      try {
        console.log('Starting initial data fetch...');
        
        // Fetch user clubs
        console.log('Fetching user clubs...');
        const { data: clubsData } = await supabase
          .from('clubs')
          .select('*')
          .eq('user_id', currentUser.id);
        
        if (!clubsData) {
          console.error('No clubs data found');
          return;
        }

        // Fetch club messages with unread status
        console.log('Fetching club messages...');
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
        console.log('Fetching direct conversations...');
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
        console.log('Fetching unread message counts...');
        const { data: unreadData } = await supabase
          .from('unread_messages')
          .select('*')
          .eq('user_id', currentUser.id);

        // Fetch notifications
        console.log('Fetching notifications...');
        const { data: notificationsData } = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', currentUser.id)
          .order('created_at', { ascending: false })
          .limit(50);

        console.log('Initial data fetch completed');
        setIsAppReady(true);
      } catch (error) {
        console.error('Error fetching initial data:', error);
        // Still mark app as ready to prevent getting stuck
        setIsAppReady(true);
      }
    };

    // Set a timeout to prevent getting stuck on loading screen
    const timeoutId = setTimeout(() => {
      console.log('Loading timeout reached, forcing app ready state');
      setIsAppReady(true);
    }, 5000);

    fetchInitialData();

    return () => {
      clearTimeout(timeoutId);
    };
  }, [currentUser, isAppReady, setIsAppReady]);

  return isAppReady;
};
