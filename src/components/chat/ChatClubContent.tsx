
import React, { useState, useEffect } from 'react';
import { Club } from '@/types';
import ChatHeader from './ChatHeader';
import ChatMessages from './ChatMessages';
import ChatInput from './ChatInput';
import { useNavigation } from '@/hooks/useNavigation';
import { useChatActions } from '@/hooks/chat/useChatActions';
import { useActiveClubMessages } from '@/hooks/chat/useActiveClubMessages';

interface ChatClubContentProps {
  club: Club;
  messages?: any[];
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
  const { deleteMessage: deleteMessageAction } = useChatActions();
  const effectiveClubId = clubId || club?.id;
  
  // Use the new hook to get and manage messages for the active club
  const { 
    messages, 
    loading, 
    isSending: hookIsSending,
    setIsSending: setHookIsSending,
    deleteMessage: hookDeleteMessage
  } = useActiveClubMessages(effectiveClubId);
  
  // Log when the message array changes to help debug
  useEffect(() => {
    console.log('[ChatClubContent] Messages updated for club:', {
      clubId: effectiveClubId,
      messageCount: messages?.length || 0
    });
  }, [messages, effectiveClubId]);
  
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
      await deleteMessageAction(messageId, setClubMessages);
    }
    
    // Also delete from the local flat array
    hookDeleteMessage(messageId);
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
    setHookIsSending(true);
    
    try {
      const messageToSend = message.trim();
      if (effectiveClubId) {
        await onSendMessage(messageToSend, effectiveClubId);
      }
    } catch (error) {
      console.error('[ChatClubContent] Error sending club message:', error);
    } finally {
      setIsSending(false);
      setHookIsSending(false);
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
            messages={messages} 
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
            isSending={isSending || hookIsSending}
          />
        </div>
      </div>
    </div>
  );
};

export default ChatClubContent;
