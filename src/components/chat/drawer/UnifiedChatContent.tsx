
import React from 'react';
import { useState, useEffect } from 'react';
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
import { ArrowLeft } from 'lucide-react';
import UserAvatar from '@/components/shared/UserAvatar';

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
  onBack: () => void;
}

const UnifiedChatContent: React.FC<UnifiedChatContentProps> = ({
  selectedChat,
  club,
  messages,
  onSendMessage,
  onDeleteMessage,
  onSelectUser,
  onBack
}) => {
  const { currentUser } = useApp();
  const { navigateToClubDetail, navigateToUserProfile } = useNavigation();
  const { markClubMessagesAsRead, markDirectConversationAsRead } = useUnreadMessages();
  const [isSending, setIsSending] = useState(false);

  // Notify about active conversation change
  useEffect(() => {
    if (selectedChat) {
      console.log(`[UnifiedChatContent] Setting active conversation: ${selectedChat.type} - ${selectedChat.id}`);
      
      // Dispatch event to notify about active conversation
      window.dispatchEvent(new CustomEvent('activeConversationChanged', { 
        detail: { 
          type: selectedChat.type, 
          id: selectedChat.id 
        } 
      }));
      
      // Mark messages as read optimistically in UI
      if (selectedChat.type === 'club') {
        markClubMessagesAsRead(selectedChat.id);
        
        // Update in database (but don't wait for completion)
        if (currentUser?.id) {
          console.log(`[UnifiedChatContent] Marking club messages as read in DB: ${selectedChat.id}`);
          // Fix: Use .then().catch() chaining instead of directly using .catch()
          supabase.from('club_messages_read')
            .upsert({
              club_id: selectedChat.id,
              user_id: currentUser.id,
              last_read_timestamp: new Date().toISOString()
            })
            .then(() => {
              console.log(`[UnifiedChatContent] Successfully marked club ${selectedChat.id} messages as read in DB`);
            })
            .then(null, (error) => {
              // Using .then(null, errorHandler) instead of .catch()
              console.error('[UnifiedChatContent] Error marking messages as read:', error);
            });
        }
      } else if (selectedChat.type === 'dm') {
        markDirectConversationAsRead(selectedChat.id);
        
        // Update in database (but don't wait for completion)
        if (currentUser?.id) {
          console.log(`[UnifiedChatContent] Marking DM conversation as read in DB: ${selectedChat.id}`);
          // Fix: Use .then().catch() chaining instead of directly using .catch()
          supabase.from('direct_messages_read')
            .upsert({
              conversation_id: selectedChat.id,
              user_id: currentUser.id,
              last_read_timestamp: new Date().toISOString()
            })
            .then(() => {
              console.log(`[UnifiedChatContent] Successfully marked conversation ${selectedChat.id} as read in DB`);
            })
            .then(null, (error) => {
              // Using .then(null, errorHandler) instead of .catch()
              console.error('[UnifiedChatContent] Error marking conversation as read:', error);
            });
        }
      }
    } else {
      // Clear active conversation when none is selected
      window.dispatchEvent(new CustomEvent('activeConversationChanged', { 
        detail: { type: null, id: null } 
      }));
    }
    
    // Cleanup on unmount or change
    return () => {
      if (selectedChat) {
        console.log(`[UnifiedChatContent] Clearing active conversation: ${selectedChat.type} - ${selectedChat.id}`);
        window.dispatchEvent(new CustomEvent('activeConversationChanged', { 
          detail: { type: null, id: null } 
        }));
      }
    };
  }, [selectedChat, currentUser?.id, markClubMessagesAsRead, markDirectConversationAsRead]);

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

  const handleHeaderClick = () => {
    if (selectedChat?.type === 'club' && club) {
      navigateToClubDetail(club.id, club);
    } else if (selectedChat?.type === 'dm') {
      // For direct messages, we need to find the other user's ID
      const otherUserId = selectedChat.id.split('_').find(id => id !== currentUser?.id);
      if (otherUserId) {
        navigateToUserProfile(otherUserId, selectedChat.name, selectedChat.avatar);
      }
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
      <div className="border-b p-3 flex items-center">
        <button onClick={onBack} className="p-2 rounded-full hover:bg-gray-100 transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div 
          onClick={handleHeaderClick} 
          className="flex-1 flex justify-center items-center gap-2 cursor-pointer hover:text-primary transition-colors px-0 mx-auto"
        >
          <UserAvatar name={selectedChat.name} image={selectedChat.avatar} size="sm" />
          <h3 className="font-semibold">{selectedChat.name}</h3>
        </div>
        <div className="w-9"></div>
      </div>
      
      <div className="flex-1 flex flex-col relative overflow-hidden">
        <div className="flex-1 min-h-0">
          <ChatMessages
            messages={messages}
            clubMembers={getMembers()}
            onDeleteMessage={onDeleteMessage}
            onSelectUser={onSelectUser}
          />
        </div>
        
        <div className="sticky bottom-0 left-0 right-0 bg-white">
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
