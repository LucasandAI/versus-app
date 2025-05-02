
import React, { useEffect, useState, useCallback } from 'react';
import { Club } from '@/types';
import ChatDrawer from '../chat/ChatDrawer';
import { useClubMessages } from '@/hooks/chat/useClubMessages';
import { useApp } from '@/context/AppContext';
import { useChatDrawerGlobal } from '@/context/ChatDrawerContext';

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
  
  // Use our hook for real-time club messages
  const { clubMessages, setClubMessages } = useClubMessages(userClubs, isOpen);
  
  // Add a local state to force re-renders when needed
  const [forceUpdateKey, setForceUpdateKey] = useState(Date.now());
  
  // Force update function that can be called from anywhere
  const forceUpdate = useCallback(() => {
    console.log('[ChatDrawerHandler] Forcing update of chat drawer');
    setForceUpdateKey(Date.now());
  }, []);
  
  // Listen for new club message events to force re-renders
  useEffect(() => {
    const handleNewMessage = (e: CustomEvent) => {
      console.log('[ChatDrawerHandler] New club message received event detected:', e.detail);
      forceUpdate();
    };
    
    const handleClubMessageReceived = () => {
      console.log('[ChatDrawerHandler] Club message received event detected');
      forceUpdate();
    };
    
    window.addEventListener('newClubMessageReceived', handleNewMessage as EventListener);
    window.addEventListener('clubMessageReceived', handleClubMessageReceived);
    
    return () => {
      window.removeEventListener('newClubMessageReceived', handleNewMessage as EventListener);
      window.removeEventListener('clubMessageReceived', handleClubMessageReceived);
    };
  }, [forceUpdate]);

  console.log('[ChatDrawerHandler] Rendering with clubMessages:', 
    Object.keys(clubMessages).length, 
    'clubs and key:', 
    forceUpdateKey);

  const handleSendMessage = async (message: string, clubId?: string) => {
    console.log('[ChatDrawerHandler] Send message requested:', { message, clubId });
    // This is just a passthrough function - the actual implementation is in MainChatDrawer
  };

  return (
    <ChatDrawer 
      key={`chat-drawer-${forceUpdateKey}`}
      open={isOpen} 
      onOpenChange={(open) => {
        if (!open) close();
      }} 
      clubs={userClubs}
      clubMessages={clubMessages}
      setClubMessages={setClubMessages}
      onSendMessage={handleSendMessage}
    />
  );
};

export default ChatDrawerHandler;
