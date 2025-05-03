
import { useEffect } from 'react';
import { useUnreadMessages } from '@/context/UnreadMessagesContext';
import { Club } from '@/types';

// This hook is now focused only on updating unread counts and firing events
// The actual message display is handled by useClubMessages
export const useRealtimeChat = (
  currentUserId: string | undefined,
  userClubs: Club[]
) => {
  const { markClubAsUnread } = useUnreadMessages();

  useEffect(() => {
    if (!currentUserId) {
      console.log('[useRealtimeChat] No current user ID, not setting up listener');
      return;
    }

    // Set up event listener for unread club messages
    const handleClubMessageUnread = (event: CustomEvent) => {
      const clubId = event.detail?.clubId;
      
      if (clubId) {
        console.log(`[useRealtimeChat] Handling clubMessageUnread event for club ${clubId}`);
        markClubAsUnread(clubId);
      }
    };
    
    // Listen for clubMessageUnread events
    window.addEventListener('clubMessageUnread', handleClubMessageUnread as EventListener);
    
    return () => {
      window.removeEventListener('clubMessageUnread', handleClubMessageUnread as EventListener);
    };
  }, [currentUserId, markClubAsUnread]);
};
