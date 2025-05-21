
import React from 'react';
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
  React.useEffect(() => {
    if (isOpen) {
      console.log('[ChatDrawerHandler] Drawer opened, refreshing unread counts');
      refreshUnreadCounts();
    }
  }, [isOpen, refreshUnreadCounts]);
  
  // Listen for club message events to refresh badges
  React.useEffect(() => {
    const handleClubMessageReceived = () => {
      if (!isOpen) {
        console.log('[ChatDrawerHandler] New club message while drawer closed, refreshing badges');
        refreshUnreadCounts();
      }
    };
    
    window.addEventListener('clubMessageReceived', handleClubMessageReceived);
    
    return () => {
      window.removeEventListener('clubMessageReceived', handleClubMessageReceived);
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
