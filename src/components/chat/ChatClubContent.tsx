
import React, { useState, useEffect } from 'react';
import { Club } from '@/types';
import ChatHeader from './ChatHeader';
import ChatMessages from './ChatMessages';
import ChatInput from './ChatInput';
import { useNavigation } from '@/hooks/useNavigation';
import { useChatActions } from '@/hooks/chat/useChatActions';

interface ChatClubContentProps {
  club: Club;
  messages: any[];
  activeMessages?: any[]; // Added activeMessages prop
  onMatchClick: () => void;
  onSelectUser: (userId: string, userName: string, userAvatar?: string) => void;
  onSendMessage: (message: string, clubId?: string) => void;
  onDeleteMessage?: (messageId: string) => void;
  setClubMessages?: React.Dispatch<React.SetStateAction<Record<string, any[]>>>;
  clubId?: string;
  setActiveClubId?: (clubId: string | null) => void;
}

const ChatClubContent = ({ 
  club,
  messages,
  activeMessages, // Use this prop if available
  onMatchClick,
  onSelectUser,
  onSendMessage,
  onDeleteMessage,
  setClubMessages,
  clubId,
  setActiveClubId
}: ChatClubContentProps) => {
  const { navigateToClubDetail } = useNavigation();
  const [isSending, setIsSending] = useState(false);
  const { deleteMessage } = useChatActions();
  const effectiveClubId = clubId || club?.id;
  
  // Use activeMessages if provided, otherwise fallback to messages
  const displayMessages = activeMessages || messages;
  
  // Log when the message array changes to help debug
  useEffect(() => {
    console.log('[ChatClubContent] Messages updated for club:', {
      clubId: effectiveClubId,
      messageCount: displayMessages?.length || 0,
      activeMessages: !!activeMessages
    });
  }, [displayMessages, effectiveClubId, activeMessages]);
  
  useEffect(() => {
    console.log('[ChatClubContent] Club changed, resetting state for:', effectiveClubId);
    setIsSending(false);
    
    // Set the active club ID when club changes
    if (setActiveClubId && effectiveClubId) {
      setActiveClubId(effectiveClubId);
      
      // Notify other components about club selection
      window.dispatchEvent(new CustomEvent('clubSelected', {
        detail: { clubId: effectiveClubId }
      }));
    }
    
    return () => {
      // Clear active club ID when component unmounts
      if (setActiveClubId) {
        window.dispatchEvent(new CustomEvent('clubDeselected'));
      }
    };
  }, [effectiveClubId, setActiveClubId]);

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

  const handleSendMessage = async (message: string) => {
    console.log('[ChatClubContent] Sending message for club:', effectiveClubId);
    setIsSending(true);
    try {
      const messageToSend = message.trim();
      if (effectiveClubId) {
        await onSendMessage(messageToSend, effectiveClubId);
      }
    } catch (error) {
      console.error('[ChatClubContent] Error sending club message:', error);
    } finally {
      setIsSending(false);
    }
  };

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
            messages={displayMessages} 
            clubMembers={club.members || []}
            onDeleteMessage={handleDeleteMessage}
            onSelectUser={onSelectUser}
            clubId={effectiveClubId}
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
