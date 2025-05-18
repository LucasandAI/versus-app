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
  
  // Generate a unique ID for this component instance to help with active tracking
  const [instanceId] = useState(() => `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`);

  // When component mounts, mark the chat as active
  useEffect(() => {
    if (selectedChat) {
      console.log(`[UnifiedChatContent] Setting up active status for ${selectedChat.type} chat: ${selectedChat.id} (instance: ${instanceId})`);
      
      // Use a timestamp to ensure newest event wins when multiple components compete
      const timestamp = Date.now();
      
      if (selectedChat.type === 'club') {
        // Dispatch an event to notify that this club is being viewed
        window.dispatchEvent(new CustomEvent('clubSelected', { 
          detail: { 
            clubId: selectedChat.id,
            timestamp
          } 
        }));
        
        // Also directly dispatch the active event for immediate effect
        window.dispatchEvent(new CustomEvent('clubActive', { 
          detail: { 
            clubId: selectedChat.id,
            timestamp,
            source: 'UnifiedChatContent',
            instanceId
          } 
        }));
        
        console.log(`[UnifiedChatContent] Dispatched clubActive for ${selectedChat.id}`);
      } else if (selectedChat.type === 'dm') {
        // Dispatch an event to notify that this conversation is being viewed
        window.dispatchEvent(new CustomEvent('conversationActive', { 
          detail: { 
            conversationId: selectedChat.id,
            timestamp,
            source: 'UnifiedChatContent',
            instanceId
          } 
        }));
        
        console.log(`[UnifiedChatContent] Dispatched conversationActive for ${selectedChat.id}`);
      }
    }
    
    // When component unmounts, mark the conversation/club as inactive
    return () => {
      if (selectedChat) {
        const timestamp = Date.now();
        console.log(`[UnifiedChatContent] Marking ${selectedChat.type} as inactive on unmount: ${selectedChat.id} (instance: ${instanceId})`);
        
        if (selectedChat.type === 'club') {
          window.dispatchEvent(new CustomEvent('clubClosed', { 
            detail: { 
              clubId: selectedChat.id,
              timestamp,
              source: 'UnifiedChatContent-unmount',
              instanceId
            } 
          }));
          
          window.dispatchEvent(new CustomEvent('clubInactive', { 
            detail: { 
              clubId: selectedChat.id,
              timestamp,
              source: 'UnifiedChatContent-unmount',
              instanceId
            } 
          }));
          
          console.log(`[UnifiedChatContent] Dispatched clubInactive for ${selectedChat.id} on unmount`);
        } else if (selectedChat.type === 'dm') {
          window.dispatchEvent(new CustomEvent('conversationInactive', { 
            detail: { 
              conversationId: selectedChat.id,
              timestamp,
              source: 'UnifiedChatContent-unmount',
              instanceId
            } 
          }));
          
          console.log(`[UnifiedChatContent] Dispatched conversationInactive for ${selectedChat.id} on unmount`);
        }
      }
    };
  }, [selectedChat, instanceId]);

  // Reset the marked-as-read state when selected chat changes
  useEffect(() => {
    setHasMarkedAsRead(false);
  }, [selectedChat?.id]);

  // Mark messages as read IMMEDIATELY when chat is selected
  useEffect(() => {
    if (selectedChat && currentUser && !hasMarkedAsRead) {
      console.log(`[UnifiedChatContent] Selected ${selectedChat.type} chat:`, selectedChat.id);
      
      // Minimal delay (none) to ensure immediate response
      const delay = 0;
      
      if (selectedChat.type === 'club') {
        console.log(`[UnifiedChatContent] Marking club ${selectedChat.id} messages as read immediately`);
        
        // First update UI optimistically
        window.dispatchEvent(new CustomEvent('messagesMarkedAsRead', { 
          detail: { 
            clubId: selectedChat.id,
            type: 'club',
            optimistic: true
          } 
        }));
        
        // Then update database with minimal delay
        markClubMessagesAsRead(selectedChat.id, undefined, delay);
        setHasMarkedAsRead(true);
      } else if (selectedChat.type === 'dm') {
        console.log(`[UnifiedChatContent] Marking DM ${selectedChat.id} as read immediately`);
        
        // First update UI optimistically
        window.dispatchEvent(new CustomEvent('messagesMarkedAsRead', { 
          detail: { 
            conversationId: selectedChat.id,
            type: 'dm',
            optimistic: true
          } 
        }));
        
        // Then update database with minimal delay
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
      const timestamp = Date.now();
      console.log(`[UnifiedChatContent] Marking ${selectedChat.type} as inactive due to back button: ${selectedChat.id} (instance: ${instanceId})`);
      
      if (selectedChat.type === 'club') {
        window.dispatchEvent(new CustomEvent('clubClosed', { 
          detail: { 
            clubId: selectedChat.id,
            timestamp,
            source: 'UnifiedChatContent-back',
            instanceId
          } 
        }));
        
        window.dispatchEvent(new CustomEvent('clubInactive', { 
          detail: { 
            clubId: selectedChat.id,
            timestamp,
            source: 'UnifiedChatContent-back',
            instanceId
          } 
        }));
        
        console.log(`[UnifiedChatContent] Dispatched clubInactive for ${selectedChat.id} on back button`);
      } else if (selectedChat.type === 'dm') {
        window.dispatchEvent(new CustomEvent('conversationInactive', { 
          detail: { 
            conversationId: selectedChat.id,
            timestamp,
            source: 'UnifiedChatContent-back',
            instanceId
          } 
        }));
        
        console.log(`[UnifiedChatContent] Dispatched conversationInactive for ${selectedChat.id} on back button`);
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
