
import React, { useState, useEffect } from 'react';
import { Club } from '@/types';
import ChatHeader from './ChatHeader';
import ChatMessages from './ChatMessages';
import ChatInput from './ChatInput';
import { useNavigation } from '@/hooks/useNavigation';
import { useChatActions } from '@/hooks/chat/useChatActions';
import { useActiveClubMessages } from '@/hooks/chat/messages/useActiveClubMessages';
import { useApp } from '@/context/AppContext';

interface ChatClubContentProps {
  club: Club;
  onMatchClick: () => void;
  onSelectUser: (userId: string, userName: string, userAvatar?: string) => void;
  clubId?: string;
}

const ChatClubContent = ({ 
  club,
  onMatchClick,
  onSelectUser,
  clubId
}: ChatClubContentProps) => {
  const { navigateToClubDetail } = useNavigation();
  const { currentUser } = useApp();
  const { deleteMessage: deleteClubMessage } = useChatActions();
  const effectiveClubId = clubId || club?.id;
  const [refreshToggle, setRefreshToggle] = useState(false);
  
  // Use the hook for active club messages
  const { 
    messages, 
    isSending, 
    setIsSending, 
    addMessage,
    deleteMessage 
  } = useActiveClubMessages(effectiveClubId);
  
  const { sendClubMessage } = useChatActions();
  
  useEffect(() => {
    console.log('[ChatClubContent] Club changed, resetting state for:', effectiveClubId);
    setIsSending(false);
  }, [effectiveClubId, setIsSending]);

  // Listen for club message events
  useEffect(() => {
    const handleClubMessage = (event: CustomEvent) => {
      if (event.detail.clubId === effectiveClubId) {
        console.log('[ChatClubContent] Received clubMessageInserted event for this club:', event.detail);
        setRefreshToggle(prev => !prev);
      }
    };
    
    window.addEventListener('clubMessageInserted', handleClubMessage as EventListener);
    
    return () => {
      window.removeEventListener('clubMessageInserted', handleClubMessage as EventListener);
    };
  }, [effectiveClubId]);

  const handleDeleteMessage = async (messageId: string) => {
    console.log('[ChatClubContent] Deleting message:', messageId);
    
    // Local optimistic update
    deleteMessage(messageId);
    
    // Server update
    await deleteClubMessage(messageId);
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
    
    const messageToSend = message.trim();
    if (!messageToSend || !effectiveClubId || !currentUser) return;
    
    setIsSending(true);
    try {
      // Create optimistic message
      const optimisticMessage = {
        id: `temp-${Date.now()}`,
        message: messageToSend,
        club_id: effectiveClubId,
        sender_id: currentUser.id,
        timestamp: new Date().toISOString(),
        sender: {
          id: currentUser.id,
          name: currentUser.name,
          avatar: currentUser.avatar
        },
        optimistic: true
      };
      
      // Add optimistic message locally
      addMessage(optimisticMessage);
      
      // Send to server
      await sendClubMessage(effectiveClubId, messageToSend);
    } catch (error) {
      console.error('[ChatClubContent] Error sending club message:', error);
    } finally {
      setIsSending(false);
    }
  };

  // Generate a key to force ChatMessages re-render when messages change
  const messagesKey = `${effectiveClubId}-${messages.length}-${refreshToggle}`;

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
            key={messagesKey}
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
