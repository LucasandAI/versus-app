import React, { useState, useEffect } from 'react';
import { Club } from '@/types';
import { useApp } from '@/context/AppContext';
import { useDirectConversationsContext } from '@/context/DirectConversationsContext';
import { supabase } from '@/integrations/supabase/client';
import ChatHeader from '../ChatHeader';
import ChatMessages from '../ChatMessages';
import ChatInput from '../ChatInput';
import { useNavigation } from '@/hooks/useNavigation';
import { useChatActions } from '@/hooks/chat/useChatActions';
import { useUnreadMessages } from '@/context/unread-messages';

interface UnifiedChatContentProps {
  selectedChat: {
    type: 'club' | 'dm';
    id: string;
    name: string;
    avatar?: string;
  } | null;
  club?: Club;
  messages: any[];
  onSendMessage: (message: string, chatId: string, type: 'club' | 'dm') => Promise<void>;
  onDeleteMessage?: (messageId: string) => Promise<void>;
  onSelectUser: (userId: string, userName: string, userAvatar?: string) => void;
}

const UnifiedChatContent: React.FC<UnifiedChatContentProps> = ({
  selectedChat,
  club,
  messages,
  onSendMessage,
  onDeleteMessage,
  onSelectUser
}) => {
  const { currentUser } = useApp();
  const { navigateToClubDetail } = useNavigation();
  const { markClubMessagesAsRead, markConversationAsRead } = useUnreadMessages();
  const [isSending, setIsSending] = useState(false);

  // Mark messages as read when chat is selected
  useEffect(() => {
    if (selectedChat) {
      if (selectedChat.type === 'club') {
        markClubMessagesAsRead(selectedChat.id);
      } else {
        markConversationAsRead(selectedChat.id);
      }
    }
  }, [selectedChat, markClubMessagesAsRead, markConversationAsRead]);

  const handleSendMessage = async (message: string) => {
    if (!selectedChat) return;
    
    setIsSending(true);
    try {
      await onSendMessage(message, selectedChat.id, selectedChat.type);
    } catch (error) {
      console.error('[UnifiedChatContent] Error sending message:', error);
    } finally {
      setIsSending(false);
    }
  };

  const handleClubClick = () => {
    if (selectedChat?.type === 'club' && club) {
      navigateToClubDetail(club.id, club);
    }
  };

  // Get the appropriate members list based on chat type
  const getMembers = () => {
    if (selectedChat?.type === 'club' && club) {
      return club.members || [];
    } else if (selectedChat?.type === 'dm') {
      return currentUser ? [currentUser] : [];
    }
    return [];
  };

  if (!selectedChat) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        Select a chat to start messaging
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <ChatHeader
        club={selectedChat.type === 'club' ? club : undefined}
        name={selectedChat.name}
        avatar={selectedChat.avatar}
        onClubClick={handleClubClick}
        onSelectUser={onSelectUser}
      />
      
      <div className="flex-1 flex flex-col relative overflow-hidden">
        <div className="flex-1 min-h-0">
          <ChatMessages
            messages={messages}
            clubMembers={getMembers()}
            onDeleteMessage={onDeleteMessage}
            onSelectUser={onSelectUser}
          />
        </div>
        
        <div className="absolute bottom-0 left-0 right-0 bg-white">
          <ChatInput
            onSendMessage={handleSendMessage}
            conversationType={selectedChat.type}
            conversationId={selectedChat.id}
            isSending={isSending}
          />
        </div>
      </div>
    </div>
  );
};

export default UnifiedChatContent; 