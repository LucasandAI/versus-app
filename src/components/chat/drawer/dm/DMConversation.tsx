
import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useApp } from '@/context/AppContext';
import { toast } from '@/hooks/use-toast';
import ChatHeader from '../../ChatHeader';
import ChatInput from '../../ChatInput';
import MessageList from '../../message/MessageList';
import { useConversations } from '@/hooks/chat/dm/useConversations';
import { useHiddenDMs } from '@/hooks/chat/useHiddenDMs';

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
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUser?.id, userId]);

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

  return (
    <div className="flex flex-col h-full w-full">
      <ChatHeader 
        title={userName}
        avatar={userAvatar}
        subtitle="Direct Message"
        backButton={true}
      />
      
      <div className="flex-1 overflow-y-auto p-4">
        <MessageList 
          messages={messages.map(formatMessage)} 
          currentUserId={currentUser?.id || ''} 
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
