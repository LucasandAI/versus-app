
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
  const { 
    clubMessages, 
    setClubMessages, 
    activeClubId, 
    setActiveClubId, 
    activeClubMessages, 
    setActiveClubMessages 
  } = useClubMessages(userClubs, isOpen);

  console.log('[ChatDrawerHandler] Rendering with clubMessages:', 
    Object.keys(clubMessages).length,
    'active club:', activeClubId,
    'active messages:', activeClubMessages?.length || 0);

  const handleSendMessage = async (message: string, clubId?: string) => {
    console.log('[ChatDrawerHandler] Send message requested:', { message, clubId });
    // This is just a passthrough function - the actual implementation is in MainChatDrawer
  };

  return (
    <ChatDrawer 
      open={isOpen} 
      onOpenChange={(open) => {
        if (!open) {
          close();
          // Clear active club when drawer closes
          setActiveClubId(null);
        }
      }} 
      clubs={userClubs}
      clubMessages={clubMessages}
      setClubMessages={setClubMessages}
      onSendMessage={handleSendMessage}
      activeClubId={activeClubId}
      setActiveClubId={setActiveClubId}
      activeClubMessages={activeClubMessages}
    />
  );
};

export default ChatDrawerHandler;
