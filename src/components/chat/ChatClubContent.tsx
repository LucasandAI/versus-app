
import React, { useState, useEffect, useCallback } from 'react';
import { Club } from '@/types';
import ChatHeader from './ChatHeader';
import ChatMessages from './ChatMessages';
import ChatInput from './ChatInput';
import { useNavigation } from '@/hooks/useNavigation';
import { useChatActions } from '@/hooks/chat/useChatActions';
import { useActiveClubMessages } from '@/hooks/chat/useActiveClubMessages';
import { useApp } from '@/context/AppContext';

interface ChatClubContentProps {
  club: Club;
  messages: any[];
  onMatchClick: () => void;
  onSelectUser: (userId: string, userName: string, userAvatar?: string) => void;
  onSendMessage: (message: string, clubId?: string) => void;
  onDeleteMessage?: (messageId: string) => void;
  setClubMessages?: React.Dispatch<React.SetStateAction<Record<string, any[]>>>;
  clubId?: string;
  globalMessages?: Record<string, any[]>;
}

const ChatClubContent = ({ 
  club,
  messages: propMessages,
  onMatchClick,
  onSelectUser,
  onSendMessage,
  onDeleteMessage,
  setClubMessages,
  clubId,
  globalMessages = {}
}: ChatClubContentProps) => {
  const { navigateToClubDetail } = useNavigation();
  const [isSending, setIsSending] = useState(false);
  const { deleteMessage } = useChatActions();
  const { currentUser } = useApp();
  const effectiveClubId = clubId || club?.id;
  
  // Use our enhanced hook to get messages that stay in sync with global state
  const { messages, createOptimisticMessage, addMessageToQueue } = useActiveClubMessages(
    effectiveClubId,
    globalMessages
  );
  
  // Log the messages length for debugging
  console.log('[ChatClubContent] Messages length:', messages.length);
  
  useEffect(() => {
    console.log('[ChatClubContent] Club changed, resetting state for:', effectiveClubId);
    setIsSending(false);
  }, [effectiveClubId]);

  const handleDeleteMessage = async (messageId: string) => {
    console.log('[ChatClubContent] Deleting message:', messageId);
    
    if (onDeleteMessage) {
      await onDeleteMessage(messageId);
    } else if (setClubMessages) {
      // Fallback to direct deleteMessage if no handler provided
      await deleteMessage(messageId, setClubMessages);
    }
  };

  const handleClubClick = () => {
    if (club && club.id) {
      navigateToClubDetail(club.id, club);
      const event = new CustomEvent('chatDrawerClosed');
      window.dispatchEvent(event);
    }
  };

  const handleSendMessage = useCallback(async (message: string) => {
    if (!message.trim() || !effectiveClubId || !currentUser) {
      return;
    }
    
    console.log('[ChatClubContent] Sending message for club:', effectiveClubId);
    setIsSending(true);
    
    try {
      // Create optimistic message
      const optimisticMessage = createOptimisticMessage(
        message,
        currentUser.id,
        currentUser.name,
        currentUser.avatar
      );
      
      // Add optimistic message to local state
      addMessageToQueue(optimisticMessage);
      
      // Add to global state if available
      if (setClubMessages) {
        setClubMessages(prev => {
          const clubMessages = prev[effectiveClubId] || [];
          return {
            ...prev,
            [effectiveClubId]: [...clubMessages, optimisticMessage]
          };
        });
      }
      
      // Send message to backend
      const messageToSend = message.trim();
      await onSendMessage(messageToSend, effectiveClubId);
    } catch (error) {
      console.error('[ChatClubContent] Error sending club message:', error);
    } finally {
      setIsSending(false);
    }
  }, [effectiveClubId, currentUser, createOptimisticMessage, addMessageToQueue, setClubMessages, onSendMessage]);

  return (
    <div className="flex flex-col h-full">
      <ChatHeader 
        club={club}
        onMatchClick={onMatchClick}
        onSelectUser={onSelectUser}
        onClubClick={handleClubClick}
      />
      
      <div className="flex-1 flex flex-col relative overflow-hidden">
        <div className="flex-1 min-h-0">
          <ChatMessages 
            messages={messages} 
            clubMembers={club.members || []}
            onDeleteMessage={handleDeleteMessage}
            onSelectUser={onSelectUser}
          />
        </div>
        
        <div className="absolute bottom-0 left-0 right-0 bg-white">
          <ChatInput 
            onSendMessage={handleSendMessage} 
            conversationType="club"
            conversationId={effectiveClubId} 
            isSending={isSending}
          />
        </div>
      </div>
    </div>
  );
};

export default ChatClubContent;
