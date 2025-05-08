
import React, { useState, useEffect, useRef } from 'react';
import { Club } from '@/types';
import ChatHeader from './ChatHeader';
import ChatMessages from './ChatMessages';
import ChatInput from './ChatInput';
import { useNavigation } from '@/hooks/useNavigation';
import { useMessageScroll } from '@/hooks/chat/useMessageScroll';
import { ClubMessage } from '@/context/ChatContext';

interface ChatClubContentProps {
  club: Club;
  messages: ClubMessage[];
  onMatchClick: () => void;
  onSelectUser: (userId: string, userName: string, userAvatar?: string) => void;
  onSendMessage: (message: string, clubId?: string) => void;
  onDeleteMessage?: (messageId: string, type: 'club' | 'direct', contextId: string) => void;
}

const ChatClubContent = ({ 
  club,
  messages,
  onMatchClick,
  onSelectUser,
  onSendMessage,
  onDeleteMessage,
}: ChatClubContentProps) => {
  const { navigateToClubDetail } = useNavigation();
  const [isSending, setIsSending] = useState(false);
  const { scrollRef, lastMessageRef, scrollToBottom } = useMessageScroll(messages);
  
  // Log the messages length for debugging
  console.log('[ChatClubContent] Messages length:', messages.length);
  
  useEffect(() => {
    // Scroll to bottom when component mounts or club changes
    scrollToBottom();
  }, [club.id]);

  const handleDeleteMessage = async (messageId: string) => {
    console.log('[ChatClubContent] Deleting message:', messageId);
    
    if (onDeleteMessage) {
      await onDeleteMessage(messageId, 'club', club.id);
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
    console.log('[ChatClubContent] Sending message for club:', club.id);
    setIsSending(true);
    try {
      const messageToSend = message.trim();
      if (club.id) {
        await onSendMessage(messageToSend, club.id);
        // Scroll to bottom after sending
        setTimeout(scrollToBottom, 100);
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
        <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto">
          <ChatMessages 
            messages={messages} 
            clubMembers={club.members || []}
            onDeleteMessage={handleDeleteMessage}
            onSelectUser={onSelectUser}
            lastMessageRef={lastMessageRef}
          />
        </div>
        
        <div className="bg-white border-t">
          <ChatInput 
            onSendMessage={handleSendMessage} 
            conversationType="club"
            conversationId={club.id} 
            isSending={isSending}
          />
        </div>
      </div>
    </div>
  );
};

export default ChatClubContent;
