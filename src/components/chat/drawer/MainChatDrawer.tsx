import React from 'react';
import { useState, useEffect, useCallback } from 'react';
import { Club } from '@/types';
import { Drawer, DrawerContent } from '@/components/ui/drawer';
import { useChatActions } from '@/hooks/chat/useChatActions';
import { useApp } from '@/context/AppContext';
import { useDirectConversationsContext } from '@/context/DirectConversationsContext';
import { useUnreadMessages } from '@/context/unread-messages';
import UnifiedChatList from './UnifiedChatList';
import UnifiedChatContent from './UnifiedChatContent';
import { useClubMessages } from '@/hooks/chat/useClubMessages';
import { useDirectMessages } from '@/hooks/chat/useDirectMessages';
import { supabase } from '@/integrations/supabase/client';

interface MainChatDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clubs: Club[];
  onNewMessage?: (count: number) => void;
  clubMessages?: Record<string, any[]>;
  setClubMessages?: React.Dispatch<React.SetStateAction<Record<string, any[]>>>;
}

const MainChatDrawer: React.FC<MainChatDrawerProps> = ({
  open,
  onOpenChange,
  clubs,
  onNewMessage,
  clubMessages = {},
  setClubMessages
}) => {
  const [selectedChat, setSelectedChat] = React.useState<{
    type: 'club' | 'dm';
    id: string;
    name: string;
    avatar?: string;
  } | null>(null);
  
  const { unreadClubs, unreadConversations } = useUnreadMessages();
  const { currentUser } = useApp();
  const { fetchConversations, getOrCreateConversation } = useDirectConversationsContext();
  const { sendMessageToClub, sendDirectMessage, deleteMessage } = useChatActions();

  // Get messages based on chat type
  const { messages: directMessages, setMessages: setDirectMessages } = useDirectMessages(
    selectedChat?.type === 'dm' ? selectedChat.id : null
  );

  // Effect to fetch conversations when drawer opens
  useEffect(() => {
    if (open && currentUser?.id) {
      fetchConversations();
    }
  }, [open, currentUser?.id, fetchConversations]);

  // Effect to handle openDirectMessage event
  useEffect(() => {
    const handleOpenDirectMessage = async (event: CustomEvent) => {
      const { userId, userName, userAvatar, conversationId } = event.detail;
      
      try {
        // If we have a conversationId, use it directly
        if (conversationId) {
          setSelectedChat({
            type: 'dm',
            id: conversationId,
            name: userName,
            avatar: userAvatar
          });
        } else {
          // Otherwise, get or create a conversation
          const conversation = await getOrCreateConversation(userId, userName, userAvatar);
          if (conversation) {
            setSelectedChat({
              type: 'dm',
              id: conversation.conversationId,
              name: conversation.userName,
              avatar: conversation.userAvatar
            });
          }
        }
      } catch (error) {
        console.error('[MainChatDrawer] Error opening direct message:', error);
      }
    };

    window.addEventListener('openDirectMessage', handleOpenDirectMessage as EventListener);
    return () => {
      window.removeEventListener('openDirectMessage', handleOpenDirectMessage as EventListener);
    };
  }, [getOrCreateConversation]);

  const handleSelectChat = React.useCallback((type: 'club' | 'dm', id: string, name: string, avatar?: string) => {
    setSelectedChat({ type, id, name, avatar });
  }, []);

  const handleSendMessage = React.useCallback(async (message: string, chatId: string, type: 'club' | 'dm') => {
    if (type === 'club' && setClubMessages) {
      await sendMessageToClub(chatId, message, setClubMessages);
    } else if (type === 'dm' && setDirectMessages) {
      await sendDirectMessage(chatId, message, setDirectMessages);
    }
  }, [sendMessageToClub, sendDirectMessage, setClubMessages, setDirectMessages]);

  const handleDeleteMessage = React.useCallback(async (messageId: string) => {
    if (selectedChat?.type === 'club' && setClubMessages) {
      await deleteMessage(messageId, setClubMessages);
    } else if (selectedChat?.type === 'dm' && setDirectMessages) {
      await deleteMessage(messageId, undefined, setDirectMessages);
    }
  }, [deleteMessage, selectedChat?.type, setClubMessages, setDirectMessages]);

  const handleSelectUser = React.useCallback((userId: string, userName: string, userAvatar?: string) => {
    const event = new CustomEvent('openDirectMessage', {
      detail: {
        userId,
        userName,
        userAvatar
      }
    });
    window.dispatchEvent(event);
  }, []);

  // Get the selected club if we're in a club chat
  const selectedClub = selectedChat?.type === 'club' 
    ? clubs.find(c => c.id === selectedChat.id) 
    : undefined;

  // Get messages for the selected chat
  const getMessages = () => {
    if (!selectedChat) return [];
    if (selectedChat.type === 'club') {
      return clubMessages[selectedChat.id] || [];
    }
    return directMessages;
  };

  const [listKey, setListKey] = React.useState(0);

  useEffect(() => {
    if (open) {
      setListKey((k) => k + 1);
    }
  }, [open]);

  const handleBack = () => {
    setSelectedChat(null);
    setListKey((k) => k + 1);
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="h-[80vh] rounded-t-xl p-0 flex flex-col">
        {selectedChat ? (
          <UnifiedChatContent
            selectedChat={selectedChat}
            club={selectedClub}
            messages={getMessages()}
            onSendMessage={handleSendMessage}
            onDeleteMessage={handleDeleteMessage}
            onSelectUser={handleSelectUser}
            onBack={handleBack}
          />
        ) : (
          <UnifiedChatList
            key={listKey}
            onSelectChat={handleSelectChat}
            selectedChatId={selectedChat?.id}
            selectedChatType={selectedChat?.type}
          />
        )}
      </DrawerContent>
    </Drawer>
  );
};

export default MainChatDrawer;
