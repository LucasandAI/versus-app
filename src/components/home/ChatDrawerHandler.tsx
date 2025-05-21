
import React, { useEffect } from 'react';
import { Club } from '@/types';
import ChatDrawer from '../chat/ChatDrawer';
import { useClubMessages } from '@/hooks/chat/useClubMessages';
import { useApp } from '@/context/AppContext';
import { useChatDrawerGlobal } from '@/context/ChatDrawerContext';
import { useUnreadMessages } from '@/context/unread-messages';

interface ChatDrawerHandlerProps {
  userClubs: Club[];
  onSelectUser: (userId: string, name: string) => void;
}

const ChatDrawerHandler: React.FC<ChatDrawerHandlerProps> = ({
  userClubs,
  onSelectUser
}) => {
  const { isOpen, close } = useChatDrawerGlobal();
  const { currentUser } = useApp();
  const { refreshUnreadCounts } = useUnreadMessages();
  
  // Use our hook for real-time club messages
  const { clubMessages, setClubMessages } = useClubMessages(userClubs, isOpen);

  // Refresh unread counts when drawer opens or closes
  useEffect(() => {
    if (isOpen) {
      console.log('[ChatDrawerHandler] Drawer opened, refreshing unread counts');
      refreshUnreadCounts();
    }
  }, [isOpen, refreshUnreadCounts]);

  // Listen for special refresh events for unread counts
  useEffect(() => {
    const handleRefreshUnreadCounts = () => {
      console.log('[ChatDrawerHandler] Refresh unread counts requested');
      refreshUnreadCounts();
    };
    
    window.addEventListener('refreshUnreadCounts', handleRefreshUnreadCounts);
    
    return () => {
      window.removeEventListener('refreshUnreadCounts', handleRefreshUnreadCounts);
    };
  }, [refreshUnreadCounts]);
  
  // Listen for club message events to refresh badges
  useEffect(() => {
    const handleClubMessageReceived = (event: CustomEvent) => {
      const { isActiveClub } = event.detail || {};
      
      if (!isActiveClub && !isOpen) {
        console.log('[ChatDrawerHandler] New club message while drawer closed, refreshing badges');
        refreshUnreadCounts();
      }
    };
    
    const handleDMMessageReceived = (event: CustomEvent) => {
      const { isActiveConversation } = event.detail || {};
      
      if (!isActiveConversation && !isOpen) {
        console.log('[ChatDrawerHandler] New DM while drawer closed, refreshing badges');
        refreshUnreadCounts();
      }
    };
    
    window.addEventListener('clubMessageReceived', handleClubMessageReceived as EventListener);
    window.addEventListener('dmMessageReceived', handleDMMessageReceived as EventListener);
    
    return () => {
      window.removeEventListener('clubMessageReceived', handleClubMessageReceived as EventListener);
      window.removeEventListener('dmMessageReceived', handleDMMessageReceived as EventListener);
    };
  }, [isOpen, refreshUnreadCounts]);

  return (
    <ChatDrawer 
      open={isOpen} 
      onOpenChange={(open) => {
        if (!open) close();
      }} 
      clubs={userClubs}
      clubMessages={clubMessages}
      setClubMessages={setClubMessages}
    />
  );
};

export default ChatDrawerHandler;
