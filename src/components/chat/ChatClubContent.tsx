
import React, { useState, useEffect, useRef } from 'react';
import { Club } from '@/types';
import ChatHeader from './ChatHeader';
import ChatMessages from './ChatMessages';
import ChatInput from './ChatInput';
import { useNavigation } from '@/hooks/useNavigation';
import { useChatActions } from '@/hooks/chat/useChatActions';

interface ChatClubContentProps {
  club: Club;
  messages: any[];
  onMatchClick: () => void;
  onSelectUser: (userId: string, userName: string, userAvatar?: string) => void;
  onSendMessage: (message: string, clubId?: string) => void;
  onDeleteMessage?: (messageId: string) => void;
  setClubMessages?: React.Dispatch<React.SetStateAction<Record<string, any[]>>>;
  clubId?: string;
}

const ChatClubContent = ({ 
  club,
  messages,
  onMatchClick,
  onSelectUser,
  onSendMessage,
  onDeleteMessage,
  setClubMessages,
  clubId
}: ChatClubContentProps) => {
  const { navigateToClubDetail } = useNavigation();
  const [isSending, setIsSending] = useState(false);
  const { deleteMessage } = useChatActions();
  const effectiveClubId = clubId || club?.id;
  const messageCountRef = useRef(0);
  const renderCountRef = useRef(0);
  const [forceUpdateKey, setForceUpdateKey] = useState(Date.now());
  
  // Enhanced debug tracking
  const lastMessageRef = useRef<string | null>(null);
  const messageHistoryRef = useRef<string[]>([]);
  
  // Use this to force updates when needed
  const forceUpdate = () => {
    setForceUpdateKey(Date.now());
  };
  
  // Track message updates with detailed logging
  useEffect(() => {
    messageCountRef.current = messages?.length || 0;
    renderCountRef.current += 1;
    
    console.log(`[ChatClubContent] 🔄 Render #${renderCountRef.current} for club ${club?.name} (${effectiveClubId})`);
    console.log(`[ChatClubContent] 📊 Messages received: ${messageCountRef.current}`);
    
    if (messages?.length > 0) {
      // Log last message details
      const lastMessage = messages[messages.length - 1];
      const lastMessageId = lastMessage?.id || 'unknown';
      
      // Check if this is a new message we haven't logged yet
      if (lastMessageId !== lastMessageRef.current) {
        lastMessageRef.current = lastMessageId;
        messageHistoryRef.current.push(lastMessageId);
        
        // Keep history limited to last 10 messages
        if (messageHistoryRef.current.length > 10) {
          messageHistoryRef.current.shift();
        }
        
        console.log(`[ChatClubContent] ✨ New last message detected:`, {
          id: lastMessage.id,
          sender: lastMessage.sender?.name || lastMessage.sender_id,
          timestamp: lastMessage.timestamp,
          text: lastMessage.message?.substring(0, 30) + (lastMessage.message?.length > 30 ? '...' : '')
        });
        
        console.log(`[ChatClubContent] 📜 Message history (last ${messageHistoryRef.current.length}):`, 
          messageHistoryRef.current.join(', '));
      }
    }
  }, [messages, effectiveClubId, club?.name]);
  
  // Update when club ID or message count changes
  useEffect(() => {
    console.log('[ChatClubContent] 🔄 Club changed, resetting state for:', effectiveClubId);
    setIsSending(false);
    messageHistoryRef.current = [];
    lastMessageRef.current = null;
    
    // Dispatch event to track club selection
    if (effectiveClubId) {
      window.dispatchEvent(new CustomEvent('clubSelected', {
        detail: { clubId: effectiveClubId }
      }));
    }
    
    return () => {
      window.dispatchEvent(new CustomEvent('clubDeselected'));
    };
  }, [effectiveClubId]);
  
  // Listen for forced update events from the message system
  useEffect(() => {
    const handleForceUpdate = (e: CustomEvent) => {
      if (e.detail?.clubId === effectiveClubId) {
        console.log(`[ChatClubContent] 🔄 Received force update event for club ${effectiveClubId}`);
        forceUpdate();
      }
    };
    
    window.addEventListener('clubMessageForceUpdate', handleForceUpdate as EventListener);
    
    return () => {
      window.removeEventListener('clubMessageForceUpdate', handleForceUpdate as EventListener);
    };
  }, [effectiveClubId]);

  const handleDeleteMessage = async (messageId: string) => {
    console.log('[ChatClubContent] 🗑️ Deleting message:', messageId);
    
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
    console.log('[ChatClubContent] 📤 Sending message for club:', effectiveClubId);
    setIsSending(true);
    try {
      const messageToSend = message.trim();
      if (effectiveClubId) {
        await onSendMessage(messageToSend, effectiveClubId);
      }
    } catch (error) {
      console.error('[ChatClubContent] ❌ Error sending club message:', error);
    } finally {
      setIsSending(false);
    }
  };

  // Create a stable key that changes when message content changes
  const messagesKey = messages?.length > 0 
    ? `${effectiveClubId}-${messages.length}-${messages[messages.length-1]?.id}-${forceUpdateKey}` 
    : `${effectiveClubId}-empty-${forceUpdateKey}`;

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
          💬 Messages: {messageCountRef.current} | 🔄 Renders: {renderCountRef.current}
          {messages?.length > 0 && (
            <span> | 🆔 Latest: {messages[messages.length - 1]?.id?.substring(0, 6)}...</span>
          )}
          | 🔑 Key: {messagesKey.substring(0, 15)}...
        </div>
        
        <div className="flex-1 min-h-0">
          <ChatMessages 
            key={messagesKey}
            messages={[...messages]} // Create fresh array reference
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
