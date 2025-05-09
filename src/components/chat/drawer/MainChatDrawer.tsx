import React, { useState, useEffect, useCallback } from 'react';
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
  const [selectedChat, setSelectedChat] = useState<{
    type: 'club' | 'dm';
    id: string;
    name: string;
    avatar?: string;
  } | null>(null);
  
  const { unreadClubs, unreadConversations } = useUnreadMessages();
  const { currentUser } = useApp();
  const { fetchConversations, getOrCreateConversation } = useDirectConversationsContext();
  const { sendMessageToClub, deleteMessage } = useChatActions();

  // Get messages based on chat type
  const { messages: directMessages } = useDirectMessages(
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

  const handleSelectChat = useCallback((type: 'club' | 'dm', id: string, name: string, avatar?: string) => {
    setSelectedChat({ type, id, name, avatar });
  }, []);

  const handleSendMessage = useCallback(async (message: string, chatId: string, type: 'club' | 'dm') => {
    if (type === 'club' && setClubMessages) {
      await sendMessageToClub(chatId, message, setClubMessages);
    } else if (type === 'dm') {
      // Handle DM message sending
      const { data, error } = await supabase
        .from('direct_messages')
        .insert({
          text: message,
          sender_id: currentUser?.id,
          conversation_id: chatId
        })
        .select()
        .single();

      if (error) {
        console.error('[MainChatDrawer] Error sending DM:', error);
        throw error;
      }
    }
  }, [sendMessageToClub, setClubMessages, currentUser?.id]);

  const handleDeleteMessage = useCallback(async (messageId: string) => {
    if (setClubMessages) {
      await deleteMessage(messageId, setClubMessages);
    }
  }, [deleteMessage, setClubMessages]);

  const handleSelectUser = useCallback((userId: string, userName: string, userAvatar?: string) => {
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

  const handleBack = () => {
    setSelectedChat(null);
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
