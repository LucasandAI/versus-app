
import React, { useEffect } from 'react';
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

  // Debug effect to log message updates
  useEffect(() => {
    console.log('[ChatDrawerHandler] Club messages updated:', 
      Object.keys(clubMessages).map(clubId => 
        `${clubId}: ${clubMessages[clubId]?.length || 0} messages`
      ).join(', ') || 'No messages');
  }, [clubMessages]);

  console.log('[ChatDrawerHandler] Rendering with clubMessages:', clubMessages);

  const handleSendMessage = async (message: string, clubId?: string) => {
    console.log('[ChatDrawerHandler] Send message requested:', { message, clubId });
    // This is just a passthrough function - the actual implementation is in MainChatDrawer
  };

  return (
    <ChatDrawer 
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
