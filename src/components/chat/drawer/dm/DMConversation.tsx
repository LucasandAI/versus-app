
import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useApp } from '@/context/AppContext';
import { toast } from '@/hooks/use-toast';
import DMHeader from './DMHeader';
import ChatInput from '../../ChatInput';
import MessageList from '../../message/MessageList';
import { useConversations } from '@/hooks/chat/dm/useConversations';
import { useHiddenDMs } from '@/hooks/chat/useHiddenDMs';
import { useMessageFormatting } from '@/hooks/chat/messages/useMessageFormatting';
import { useMessageScroll } from '@/hooks/chat/useMessageScroll';
import AppHeader from '@/components/shared/AppHeader';

interface DMConversationProps {
  userId: string;
  userName: string;
  userAvatar?: string;
}

const DMConversation: React.FC<DMConversationProps> = ({ userId, userName, userAvatar }) => {
  const { currentUser } = useApp();
  const [messages, setMessages] = useState<any[]>([]);
  const [isSending, setIsSending] = useState(false);
  const { hiddenDMs, refreshConversations } = useHiddenDMs();
  const { refreshConversations: updateConversationsList } = useConversations(hiddenDMs);
  const { formatTime } = useMessageFormatting();
  const { scrollRef, lastMessageRef, scrollToBottom } = useMessageScroll(messages);

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        if (!currentUser?.id) return;

        const { data, error } = await supabase
          .from('direct_messages')
          .select('*')
          .or(`and(sender_id.eq.${currentUser.id},receiver_id.eq.${userId}),and(sender_id.eq.${userId},receiver_id.eq.${currentUser.id})`)
          .order('timestamp', { ascending: true });

        if (error) throw error;
        setMessages(data || []);
        
        // Scroll to the bottom when messages load
        setTimeout(() => {
          scrollToBottom();
        }, 100);
      } catch (error) {
        console.error('Error fetching DM messages:', error);
        toast({
          title: "Error",
          description: "Could not load messages",
          variant: "destructive"
        });
      }
    };

    fetchMessages();

    // Subscribe to real-time updates for this conversation
    const channel = supabase
      .channel(`dm-conversation-${userId}`)
      .on('postgres_changes', 
        {
          event: 'INSERT',
          schema: 'public',
          table: 'direct_messages',
          filter: `or(and(sender_id.eq.${currentUser?.id},receiver_id.eq.${userId}),and(sender_id.eq.${userId},receiver_id.eq.${currentUser?.id}))`
        },
        (payload) => {
          // Add the new message to the conversation
          setMessages(prev => [...prev, payload.new as any]);
          
          // Scroll to the bottom when a new message arrives
          setTimeout(() => {
            scrollToBottom();
          }, 100);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUser?.id, userId, scrollToBottom]);

  const handleSendMessage = async (text: string) => {
    try {
      setIsSending(true);
      
      if (!currentUser?.id) {
        throw new Error("You must be logged in to send messages");
      }
      
      const message = {
        sender_id: currentUser.id,
        receiver_id: userId,
        text
      };
      
      const { error } = await supabase
        .from('direct_messages')
        .insert(message);
      
      if (error) throw error;
      
      // Immediately refresh the conversation list to update the sidebar
      updateConversationsList();
      
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Could not send message",
        variant: "destructive"
      });
    } finally {
      setIsSending(false);
    }
  };

  const formatMessage = (message: any) => {
    return {
      id: message.id,
      text: message.text,
      timestamp: message.timestamp,
      sender: {
        id: message.sender_id,
        name: message.sender_id === currentUser?.id ? currentUser.name : userName,
      },
      isCurrentUser: message.sender_id === currentUser?.id
    };
  };

  // Create a dummy array of club members for MessageList
  const dummyClubMembers = [
    { id: currentUser?.id || '', name: currentUser?.name || 'You' },
    { id: userId, name: userName }
  ];

  return (
    <div className="flex flex-col h-full w-full">
      <AppHeader
        title={userName}
        onBack={() => window.history.back()}
      />
      
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4">
        <MessageList 
          messages={messages.map(formatMessage)}
          clubMembers={dummyClubMembers}
          formatTime={formatTime}
          currentUserAvatar={currentUser?.avatar || ''}
          currentUserId={currentUser?.id || ''}
          lastMessageRef={lastMessageRef}
        />
      </div>
      
      <ChatInput 
        onSendMessage={handleSendMessage} 
        isSending={isSending}
        conversationId={userId}
        conversationType="dm"
      />
    </div>
  );
};

export default DMConversation;
