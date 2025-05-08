
import React, { useState, useEffect, useCallback } from 'react';
import { Club } from '@/types';
import ChatHeader from './ChatHeader';
import ChatMessages from './ChatMessages';
import ChatInput from './ChatInput';
import { useNavigation } from '@/hooks/useNavigation';
import { useChatActions } from '@/hooks/chat/useChatActions';
import { useActiveClubMessages } from '@/hooks/chat/useActiveClubMessages';

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
  
  // Use our new hook to get messages that stay in sync with global state
  const { messages } = useActiveClubMessages(
    effectiveClubId,
    globalMessages
  );
  
  // Log the messages length as requested
  console.log('[ChatClubContent] Messages length:', messages.length);
  
  useEffect(() => {
    console.log('[ChatClubContent] Club changed, resetting state for:', effectiveClubId);
    setIsSending(false);
  }, [effectiveClubId]);

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
    console.log('[ChatClubContent] Sending message for club:', effectiveClubId);
    
    // Immediately set isSending to true like in DM implementation
    setIsSending(true);
    
    try {
      const messageToSend = message.trim();
      if (effectiveClubId) {
        await onSendMessage(messageToSend, effectiveClubId);
      }
      
      // After message is sent, scroll to bottom using requestAnimationFrame for smoother animation
      requestAnimationFrame(() => {
        const messageContainer = document.querySelector(`[data-conversation-id="${effectiveClubId}"]`)?.parentElement?.previousElementSibling;
        if (messageContainer) {
          messageContainer.scrollTop = messageContainer.scrollHeight;
        }
      });
    } catch (error) {
      console.error('[ChatClubContent] Error sending club message:', error);
    } finally {
      setIsSending(false);
    }
  }, [effectiveClubId, onSendMessage]);

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

export default React.memo(ChatClubContent);
