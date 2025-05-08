
import React, { useState, useEffect, useCallback } from 'react';
import { Club } from '@/types';
import ChatHeader from './ChatHeader';
import ChatMessages from './ChatMessages';
import ChatInput from './ChatInput';
import { useNavigation } from '@/hooks/useNavigation';
import { useChatActions } from '@/hooks/chat/useChatActions';
import { useActiveClubMessages } from '@/hooks/chat/useActiveClubMessages';
import { useMessageScroll } from '@/hooks/chat/useMessageScroll';
import { v4 as uuidv4 } from 'uuid';

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
  const effectiveClubId = clubId || club?.id;
  
  // Use our enhanced hook to get messages that stay in sync with global state
  const { messages, addOptimisticMessage } = useActiveClubMessages(
    effectiveClubId,
    globalMessages
  );
  
  // Use our optimized scroll hook with club ID to isolate context
  const { scrollRef, lastMessageRef, scrollToBottom } = useMessageScroll(
    messages,
    effectiveClubId
  );
  
  // Event for notifying that club has been selected
  useEffect(() => {
    if (effectiveClubId) {
      // Dispatch event that this club is selected
      window.dispatchEvent(new CustomEvent('clubSelected', { 
        detail: { clubId: effectiveClubId } 
      }));
    }
    
    return () => {
      // Dispatch event that club is deselected when component unmounts
      window.dispatchEvent(new CustomEvent('clubDeselected'));
    };
  }, [effectiveClubId]);
  
  useEffect(() => {
    console.log('[ChatClubContent] Club changed, resetting state for:', effectiveClubId);
    setIsSending(false);
    // Reset scroll position when club changes, with slight delay to ensure DOM is updated
    setTimeout(() => {
      if (messages && messages.length > 0) {
        scrollToBottom(false);
      }
    }, 50);
  }, [effectiveClubId, messages, scrollToBottom]);

  const handleDeleteMessage = useCallback(async (messageId: string) => {
    console.log('[ChatClubContent] Deleting message:', messageId);
    
    if (onDeleteMessage) {
      await onDeleteMessage(messageId);
    } else if (setClubMessages) {
      // Fallback to direct deleteMessage if no handler provided
      await deleteMessage(messageId, setClubMessages);
    }
  }, [onDeleteMessage, setClubMessages, deleteMessage]);

  const handleClubClick = useCallback(() => {
    if (club && club.id) {
      navigateToClubDetail(club.id, club);
      const event = new CustomEvent('chatDrawerClosed');
      window.dispatchEvent(event);
    }
  }, [club, navigateToClubDetail]);

  const handleSendMessage = useCallback(async (message: string) => {
    if (!message.trim() || !effectiveClubId) return;
    
    console.log('[ChatClubContent] Sending message for club:', effectiveClubId);
    
    // Set isSending immediately for UI feedback
    setIsSending(true);
    
    try {
      const trimmedMessage = message.trim();
      
      // Get current user from local storage to create optimistic message
      const userDataStr = localStorage.getItem('currentUser');
      const userData = userDataStr ? JSON.parse(userDataStr) : null;
      
      // Create an optimistic message with temporary ID
      if (userData) {
        const optimisticId = `temp-${uuidv4()}`;
        const now = new Date().toISOString();
        
        const optimisticMessage = {
          id: optimisticId,
          message: trimmedMessage,
          sender_id: userData.id,
          club_id: effectiveClubId,
          timestamp: now,
          sender: {
            id: userData.id,
            name: userData.name,
            avatar: userData.avatar
          },
          optimistic: true
        };
        
        // Add the optimistic message
        addOptimisticMessage(optimisticMessage);
        
        // Scroll to the new message
        setTimeout(() => scrollToBottom(true), 10);
      }
      
      // Actually send the message
      await onSendMessage(trimmedMessage, effectiveClubId);
      
      // Scroll to bottom after sending
      setTimeout(() => scrollToBottom(true), 50);
    } catch (error) {
      console.error('[ChatClubContent] Error sending club message:', error);
    } finally {
      // Reset sending state
      setIsSending(false);
    }
  }, [effectiveClubId, onSendMessage, addOptimisticMessage, scrollToBottom]);

  return (
    <div className="flex flex-col h-full">
      <ChatHeader 
        club={club}
        onMatchClick={onMatchClick}
        onSelectUser={onSelectUser}
        onClubClick={handleClubClick}
      />
      
      <div className="flex-1 flex flex-col relative overflow-hidden">
        <div className="flex-1 min-h-0 transition-opacity duration-150">
          <ChatMessages 
            messages={messages} 
            clubMembers={club.members || []}
            onDeleteMessage={handleDeleteMessage}
            onSelectUser={onSelectUser}
            scrollRef={scrollRef}
            lastMessageRef={lastMessageRef}
            chatId={effectiveClubId}
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

export default React.memo(ChatClubContent);
