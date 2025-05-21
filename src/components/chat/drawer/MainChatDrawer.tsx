
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
import { useCoalescedReadStatus } from '@/hooks/chat/messages/useCoalescedReadStatus';

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
  
  const { unreadClubs, unreadConversations, refreshUnreadCounts } = useUnreadMessages();
  const { markConversationAsRead, markClubAsRead } = useCoalescedReadStatus();
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
      console.log('[MainChatDrawer] Drawer opened - fetching conversations and unread counts');
      fetchConversations();
      refreshUnreadCounts();
    }
  }, [open, currentUser?.id, fetchConversations, refreshUnreadCounts]);

  // Effect to refresh unread counts when drawer visibility changes
  useEffect(() => {
    if (!open) return;
    
    // When drawer opens, refresh unread counts
    refreshUnreadCounts();
    
    // Set up an interval to refresh counts periodically while drawer is open
    const intervalId = setInterval(() => {
      refreshUnreadCounts();
    }, 10000); // Refresh every 10 seconds
    
    return () => clearInterval(intervalId);
  }, [open, refreshUnreadCounts]);

  // Listen for club message and DM events to handle real-time messages
  useEffect(() => {
    const handleClubMessageReceived = (event: CustomEvent) => {
      const { clubId, isActiveClub } = event.detail;
      console.log('[MainChatDrawer] Club message received:', { clubId, isActiveClub });
      
      // If the message isn't for the currently selected chat, refresh unread counts
      if (!isActiveClub) {
        // Small delay to ensure database operations complete
        setTimeout(() => refreshUnreadCounts(), 100);
      } else {
        // If it is for the active club, ensure it's not marked as unread
        if (selectedChat?.type === 'club' && selectedChat.id === clubId) {
          markClubAsRead(clubId, false); // Use false for debounced database update
        }
      }
    };
    
    const handleDMMessageReceived = (event: CustomEvent) => {
      const { conversationId } = event.detail;
      console.log('[MainChatDrawer] DM received:', { conversationId });
      
      // If the message isn't for the currently selected chat, refresh unread counts
      const isActiveConversation = selectedChat?.type === 'dm' && selectedChat.id === conversationId;
      
      if (!isActiveConversation) {
        // Small delay to ensure database operations complete
        setTimeout(() => refreshUnreadCounts(), 100);
      } else {
        // If it is for the active conversation, ensure it's not marked as unread
        markConversationAsRead(conversationId, false); // Use false for debounced database update
      }
    };
    
    const handleMessagesMarkedAsRead = () => {
      console.log('[MainChatDrawer] Messages marked as read, refreshing counts');
      // Refresh unread counts after a short delay to ensure database operations complete
      setTimeout(() => refreshUnreadCounts(), 200);
    };
    
    // Listen for manual refresh request
    const handleRefreshRequest = () => {
      console.log('[MainChatDrawer] Refresh requested');
      refreshUnreadCounts();
    };
    
    window.addEventListener('clubMessageReceived', handleClubMessageReceived as EventListener);
    window.addEventListener('dmMessageReceived', handleDMMessageReceived as EventListener);
    window.addEventListener('messagesMarkedAsRead', handleMessagesMarkedAsRead as EventListener);
    window.addEventListener('refreshUnreadCounts', handleRefreshRequest as EventListener);
    
    return () => {
      window.removeEventListener('clubMessageReceived', handleClubMessageReceived as EventListener);
      window.removeEventListener('dmMessageReceived', handleDMMessageReceived as EventListener);
      window.removeEventListener('messagesMarkedAsRead', handleMessagesMarkedAsRead as EventListener);
      window.removeEventListener('refreshUnreadCounts', handleRefreshRequest as EventListener);
    };
  }, [selectedChat, refreshUnreadCounts, markClubAsRead, markConversationAsRead]);

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
        
        // Refresh unread counts after a delay to ensure read status is updated
        setTimeout(() => refreshUnreadCounts(), 400);
      } catch (error) {
        console.error('[MainChatDrawer] Error opening direct message:', error);
      }
    };

    window.addEventListener('openDirectMessage', handleOpenDirectMessage as EventListener);
    return () => {
      window.removeEventListener('openDirectMessage', handleOpenDirectMessage as EventListener);
    };
  }, [getOrCreateConversation, refreshUnreadCounts]);

  const handleSelectChat = React.useCallback((type: 'club' | 'dm', id: string, name: string, avatar?: string) => {
    console.log(`[MainChatDrawer] Selecting chat: ${type} - ${id}`);
    
    // Set the selected chat
    setSelectedChat({ type, id, name, avatar });
    
    // Mark as read immediately using local-first approach
    if (type === 'club') {
      markClubAsRead(id, true); // Use true for immediate database update
    } else if (type === 'dm') {
      markConversationAsRead(id, true); // Use true for immediate database update
    }
    
    // Refresh unread counts after chat selection
    setTimeout(() => refreshUnreadCounts(), 200);
    
    // Dispatch a special event for immediate UI update of the unread badge
    window.dispatchEvent(new CustomEvent('conversationOpened', {
      detail: {
        type,
        id
      }
    }));
  }, [refreshUnreadCounts, markClubAsRead, markConversationAsRead]);

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
      
      // When drawer opens, force a refresh of unread counts
      setTimeout(() => refreshUnreadCounts(), 200);
    }
  }, [open, refreshUnreadCounts]);

  const handleBack = () => {
    setSelectedChat(null);
    setListKey((k) => k + 1);
    
    // Refresh unread counts when going back to the chat list
    refreshUnreadCounts();
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
