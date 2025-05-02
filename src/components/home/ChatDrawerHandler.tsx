
import React, { useEffect, useState } from 'react';
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
  
  // Listen for real-time message events
  useEffect(() => {
    const handleNewMessage = () => {
      console.log('[ChatDrawerHandler] New message detected, updating UI');
      setForceUpdateKey(Date.now());
    };
    
    window.addEventListener('clubMessageReceived', handleNewMessage);
    
    return () => {
      window.removeEventListener('clubMessageReceived', handleNewMessage);
    };
  }, []);

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
