import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  const { fetchConversations } = useDirectConversationsContext();
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

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="h-[80vh] rounded-t-xl p-0 flex flex-col">
        <div className="flex h-full">
          {/* Chat List Sidebar */}
          <div className="w-80 border-r">
            <UnifiedChatList
              clubs={clubs}
              selectedChat={selectedChat}
              onSelectChat={handleSelectChat}
              unreadClubs={unreadClubs}
              unreadConversations={unreadConversations}
            />
          </div>

          {/* Chat Content */}
          <div className="flex-1">
            <UnifiedChatContent
              selectedChat={selectedChat}
              club={selectedClub}
              messages={getMessages()}
              onSendMessage={handleSendMessage}
              onDeleteMessage={handleDeleteMessage}
              onSelectUser={handleSelectUser}
            />
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default MainChatDrawer;
