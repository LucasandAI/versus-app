
import React, { useState, useRef } from 'react';
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
  messages?: any[]; // Now optional since we'll use local state
  onMatchClick: () => void;
  onSelectUser: (userId: string, userName: string, userAvatar?: string) => void;
  onSendMessage: (message: string, clubId?: string) => void;
  onDeleteMessage?: (messageId: string) => void;
  setClubMessages?: React.Dispatch<React.SetStateAction<Record<string, any[]>>>;
  clubId?: string;
}

const ChatClubContent = ({ 
  club,
  messages: externalMessages,
  onMatchClick,
  onSelectUser,
  onSendMessage,
  onDeleteMessage,
  setClubMessages,
  clubId
}: ChatClubContentProps) => {
  const { navigateToClubDetail } = useNavigation();
  const [isSending, setIsSending] = useState(false);
  const { deleteMessage: deleteMessageAction } = useChatActions();
  const effectiveClubId = clubId || club?.id;
  const renderCountRef = useRef(0);
  const { currentUser } = useApp();
  const [forceRenderKey, setForceRenderKey] = useState(Date.now());
  
  // Use our new local-state hook for this specific club
  const {
    messages: localMessages,
    loading,
    addMessage,
    deleteMessage: deleteLocalMessage,
    debugInfo
  } = useActiveClubMessages(effectiveClubId);
  
  // Increment render counter for debugging
  renderCountRef.current += 1;
  
  // Use localMessages instead of passed-in messages
  const messages = localMessages;
  
  console.log(`[ChatClubContent] 🔄 Render #${renderCountRef.current} for club ${club?.name} (${effectiveClubId})`);
  console.log(`[ChatClubContent] 📊 Messages count: ${messages?.length || 0}`);

  // 🚨 NEW ADDITION: Listen for clubMessageForceUpdate event
  React.useEffect(() => {
    const forceUpdate = (e: CustomEvent) => {
      console.log(`[ChatClubContent] 🔥 Force update triggered by event for club ${effectiveClubId}`);
      setForceRenderKey(Date.now());
    };
    
    window.addEventListener('clubMessageForceUpdate', forceUpdate as EventListener);
    
    return () => {
      window.removeEventListener('clubMessageForceUpdate', forceUpdate as EventListener);
    };
  }, [effectiveClubId]);

  const handleDeleteMessage = async (messageId: string) => {
    console.log('[ChatClubContent] 🗑️ Deleting message:', messageId);
    
    // Delete locally first
    deleteLocalMessage(messageId);
    
    // Then handle persistence
    if (onDeleteMessage) {
      await onDeleteMessage(messageId);
    } else if (setClubMessages) {
      // Fallback to direct deleteMessage if no handler provided
      await deleteMessageAction(messageId, setClubMessages);
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
    console.log('[ChatClubContent] 📤 Sending message for club:', effectiveClubId);
    
    setIsSending(true);
    try {
      const messageToSend = message.trim();
      if (effectiveClubId) {
        // Add optimistic message if we have the user data
        if (currentUser) {
          const optimisticId = `temp-${Date.now()}`;
          const optimisticMessage = {
            id: optimisticId,
            message: messageToSend,
            sender_id: currentUser.id,
            club_id: effectiveClubId,
            timestamp: new Date().toISOString(),
            sender: {
              id: currentUser.id,
              name: currentUser.name,
              avatar: currentUser.avatar
            },
            optimistic: true
          };
          
          // Add to local state first for immediate feedback
          addMessage(optimisticMessage);
        }
        
        // Send to server
        await onSendMessage(messageToSend, effectiveClubId);
      }
    } catch (error) {
      console.error('[ChatClubContent] ❌ Error sending club message:', error);
    } finally {
      setIsSending(false);
    }
  };

  // 🚨 IMPROVED: Create a stable key that changes when message content changes or when force update is triggered
  const lastMessageId = messages?.length > 0 ? messages[messages.length-1]?.id : 'no-messages';
  const messagesKey = `${effectiveClubId}-${messages?.length || 0}-${lastMessageId}-${forceRenderKey}-${debugInfo.renderCount}`;

  return (
    <div className="flex flex-col h-full">
      <ChatHeader 
        club={club}
        onMatchClick={onMatchClick}
        onSelectUser={onSelectUser}
        onClubClick={handleClubClick}
      />
      
      <div className="flex-1 flex flex-col relative overflow-hidden">
        {/* Enhanced debug info */}
        <div className="bg-yellow-100 px-2 py-1 text-xs">
          💬 Messages: {messages?.length || 0} | 🔄 Renders: {renderCountRef.current}
          {messages?.length > 0 && (
            <span> | 🆔 Latest: {messages[messages.length - 1]?.id?.substring(0, 6)}...</span>
          )}
          | 🔑 Key: {messagesKey.substring(0, 15)}...
          {loading && <span className="ml-1 text-orange-600">⏳ Loading...</span>}
        </div>
        
        <div className="flex-1 min-h-0">
          <ChatMessages 
            key={messagesKey}
            messages={messages} // Pass local state directly
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
