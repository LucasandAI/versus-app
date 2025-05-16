
import React, { useEffect, useState } from 'react';
import { Club } from '@/types';
import { useApp } from '@/context/AppContext';
import ChatHeader from '../ChatHeader';
import ChatMessages from '../ChatMessages';
import ChatInput from '../ChatInput';
import { useNavigation } from '@/hooks/useNavigation';
import { useChatActions } from '@/hooks/chat/useChatActions';
import { useMessageScroll } from '@/hooks/chat/useMessageScroll';
import { ArrowLeft } from 'lucide-react';
import UserAvatar from '@/components/shared/UserAvatar';
import { useMessageReadStatus } from '@/hooks/chat/useMessageReadStatus';

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
  const { markDirectMessagesAsRead, markClubMessagesAsRead } = useMessageReadStatus();
  const [isSending, setIsSending] = useState(false);
  const [hasMarkedAsRead, setHasMarkedAsRead] = useState(false);

  // When component mounts, mark the chat as active
  useEffect(() => {
    if (selectedChat) {
      console.log(`[UnifiedChatContent] Setting up active status for ${selectedChat.type} chat: ${selectedChat.id}`);
      
      if (selectedChat.type === 'club') {
        // Dispatch an event to notify that this club is being viewed
        window.dispatchEvent(new CustomEvent('clubSelected', { 
          detail: { clubId: selectedChat.id } 
        }));
        
        // Also directly dispatch the active event for immediate effect
        window.dispatchEvent(new CustomEvent('clubActive', { 
          detail: { clubId: selectedChat.id } 
        }));
      } else if (selectedChat.type === 'dm') {
        // Dispatch an event to notify that this conversation is being viewed
        window.dispatchEvent(new CustomEvent('conversationActive', { 
          detail: { conversationId: selectedChat.id } 
        }));
      }
    }
    
    // When component unmounts, mark the conversation/club as inactive
    return () => {
      if (selectedChat) {
        console.log(`[UnifiedChatContent] Marking ${selectedChat.type} as inactive on unmount: ${selectedChat.id}`);
        
        if (selectedChat.type === 'club') {
          window.dispatchEvent(new CustomEvent('clubClosed', { 
            detail: { clubId: selectedChat.id } 
          }));
          
          window.dispatchEvent(new CustomEvent('clubInactive', { 
            detail: { clubId: selectedChat.id } 
          }));
        } else if (selectedChat.type === 'dm') {
          window.dispatchEvent(new CustomEvent('conversationInactive', { 
            detail: { conversationId: selectedChat.id } 
          }));
        }
      }
    };
  }, [selectedChat]);

  // Reset the marked-as-read state when selected chat changes
  useEffect(() => {
    setHasMarkedAsRead(false);
  }, [selectedChat?.id]);

  // Mark messages as read when chat is selected
  useEffect(() => {
    if (selectedChat && currentUser && !hasMarkedAsRead) {
      console.log(`[UnifiedChatContent] Selected ${selectedChat.type} chat:`, selectedChat.id);
      
      // Use a short delay to avoid multiple simultaneous operations
      const delay = 300;
      
      if (selectedChat.type === 'club') {
        console.log(`[UnifiedChatContent] Marking club ${selectedChat.id} messages as read with delay ${delay}ms`);
        markClubMessagesAsRead(selectedChat.id, undefined, delay);
        setHasMarkedAsRead(true);
      } else if (selectedChat.type === 'dm') {
        console.log(`[UnifiedChatContent] Marking DM ${selectedChat.id} as read with delay ${delay}ms`);
        markDirectMessagesAsRead(selectedChat.id, undefined, delay);
        setHasMarkedAsRead(true);
      }
    }
  }, [selectedChat, currentUser, markClubMessagesAsRead, markDirectMessagesAsRead, hasMarkedAsRead]);

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

  const handleBackClick = () => {
    // Before going back, mark the chat as inactive
    if (selectedChat) {
      console.log(`[UnifiedChatContent] Marking ${selectedChat.type} as inactive due to back button: ${selectedChat.id}`);
      
      if (selectedChat.type === 'club') {
        window.dispatchEvent(new CustomEvent('clubClosed', { 
          detail: { clubId: selectedChat.id } 
        }));
        
        window.dispatchEvent(new CustomEvent('clubInactive', { 
          detail: { clubId: selectedChat.id } 
        }));
      } else if (selectedChat.type === 'dm') {
        window.dispatchEvent(new CustomEvent('conversationInactive', { 
          detail: { conversationId: selectedChat.id } 
        }));
      }
    }
    
    onBack();
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
        <button onClick={handleBackClick} className="p-2 rounded-full hover:bg-gray-100 transition-colors">
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
