
import React, { useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useApp } from '@/context/AppContext';
import ChatMessages from '../../ChatMessages';
import ChatInput from '../../ChatInput';
import { useDMMessages } from '@/hooks/chat/dm/useDMMessages';
import { useDMSubscription } from '@/hooks/chat/dm/useDMSubscription';
import { useNavigation } from '@/hooks/useNavigation';
import { toast } from '@/hooks/use-toast';
import { useHiddenDMs } from '@/hooks/chat/useHiddenDMs';
import { useConversations } from '@/hooks/chat/dm/useConversations';
import { useMessageFormatting } from '@/hooks/chat/messages/useMessageFormatting';

interface DMConversationProps {
  userId: string;
  userName: string;
  userAvatar?: string;
}

const DMConversation: React.FC<DMConversationProps> = ({ 
  userId, 
  userName, 
  userAvatar 
}) => {
  const { currentUser } = useApp();
  const { navigateToUserProfile } = useNavigation();
  const { messages, setMessages, isSending, setIsSending } = useDMMessages(userId, userName);
  const { updateConversation } = useConversations([]);
  const { unhideConversation } = useHiddenDMs();
  const lastMessageRef = useRef<HTMLDivElement>(null);
  const { formatTime } = useMessageFormatting();
  
  useDMSubscription(userId, currentUser?.id, setMessages);

  // Scroll to bottom on new messages or when conversation opens
  useEffect(() => {
    if (lastMessageRef.current) {
      lastMessageRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'end'
      });
    }
  }, [messages.length]);

  const handleSendMessage = async (message: string) => {
    if (!message.trim() || !currentUser?.id || !userId) return;
    setIsSending(true);
    
    unhideConversation(userId);
    
    const optimisticId = `temp-${Date.now()}`;
    const newMessageObj = {
      id: optimisticId,
      text: message,
      sender: {
        id: currentUser.id,
        name: currentUser.name,
        avatar: currentUser.avatar
      },
      timestamp: new Date().toISOString()
    };

    try {
      // Add message to the chat window immediately after attempting to send
      setMessages(prev => [...prev, newMessageObj]);
      
      // Update the conversation list immediately
      updateConversation(userId, message, userName, userAvatar);

      const { data, error } = await supabase
        .from('direct_messages')
        .insert({
          sender_id: currentUser.id,
          receiver_id: userId,
          text: message
        })
        .select('*')
        .single();

      if (error) throw error;
      
      if (data) {
        setMessages(prev => 
          prev.map(msg => msg.id === optimisticId ? {
            ...msg,
            id: data.id
          } : msg)
        );
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Could not send message",
        variant: "destructive"
      });
      setMessages(prev => prev.filter(msg => msg.id !== optimisticId));
    } finally {
      setIsSending(false);
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    try {
      setMessages(prev => prev.filter(msg => msg.id !== messageId));
      
      const { error } = await supabase
        .from('direct_messages')
        .delete()
        .eq('id', messageId);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting message:', error);
      toast({
        title: "Error",
        description: "Could not delete message",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="flex flex-col h-full w-full">
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        <div className="flex-1 min-h-0">
          <ChatMessages 
            messages={messages}
            clubMembers={currentUser ? [currentUser] : []}
            onDeleteMessage={handleDeleteMessage}
            onSelectUser={(userId, userName, userAvatar) => 
              navigateToUserProfile(userId, userName, userAvatar)
            }
            currentUserAvatar={currentUser?.avatar}
            lastMessageRef={lastMessageRef}
            formatTime={formatTime}
          />
        </div>
        
        <div className="bg-white">
          <ChatInput 
            onSendMessage={handleSendMessage}
            isSending={isSending}
            conversationId={userId}
            conversationType="dm"
          />
        </div>
      </div>
    </div>
  );
};

export default DMConversation;
