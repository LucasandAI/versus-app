
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useApp } from '@/context/AppContext';
import ChatMessages from '../../ChatMessages';
import ChatInput from '../../ChatInput';
import { toast } from '@/hooks/use-toast';
import UserAvatar from '@/components/shared/UserAvatar';
import { useNavigation } from '@/hooks/useNavigation';
import { useHiddenDMs } from '@/hooks/chat/useHiddenDMs';

interface DMConversationProps {
  userId: string;
  userName: string;
  userAvatar?: string;
}

const DMConversation: React.FC<DMConversationProps> = ({ userId, userName, userAvatar }) => {
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const { currentUser } = useApp();
  const { navigateToUserProfile } = useNavigation();
  const { unhideConversation } = useHiddenDMs();

  // Reset state when conversation changes
  useEffect(() => {
    console.log('[DMConversation] Conversation changed, resetting state for:', userId);
    setMessages([]);
    setLoading(true);
  }, [userId]);

  useEffect(() => {
    const fetchMessages = async () => {
      if (!userId || !currentUser?.id) return;
      
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('direct_messages')
          .select('*')
          .or(`and(sender_id.eq.${currentUser.id},receiver_id.eq.${userId}),and(sender_id.eq.${userId},receiver_id.eq.${currentUser.id})`)
          .order('timestamp', { ascending: true });

        if (error) {
          throw error;
        }

        const formattedMessages = (data || []).map((msg) => ({
          id: msg.id,
          text: msg.text,
          sender: {
            id: msg.sender_id,
            name: msg.sender_id === currentUser.id ? currentUser.name : userName,
            avatar: msg.sender_id === currentUser.id ? currentUser.avatar : userAvatar
          },
          timestamp: msg.timestamp,
        }));

        setMessages(formattedMessages);
      } catch (error) {
        console.error('Error fetching direct messages:', error);
        toast({
          title: "Error",
          description: "Could not load messages",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();
  }, [userId, currentUser?.id, userName, userAvatar, currentUser?.name, currentUser?.avatar]);

  useEffect(() => {
    // Create a channel specific to this DM conversation
    const channel = supabase
      .channel(`dm-conversation-${userId}-${currentUser?.id}`)
      .on('postgres_changes', 
          { event: 'DELETE', schema: 'public', table: 'direct_messages' },
          (payload) => {
            if (payload.old) {
              setMessages(prev => prev.filter(msg => msg.id !== payload.old.id));
            }
          })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, currentUser?.id]);

  const handleSendMessage = async (message: string) => {
    if (!message.trim() || !currentUser?.id || !userId) return;

    // Set sending state to prevent multiple sends
    setIsSending(true);
    
    // Capture message in local scope to ensure we're using the current value
    const messageToSend = message.trim();
    
    unhideConversation(userId);

    // Create optimistic message
    const optimisticId = `temp-${Date.now()}`;
    const newMessageObj = {
      id: optimisticId,
      text: messageToSend,
      sender: {
        id: currentUser.id,
        name: currentUser.name,
        avatar: currentUser.avatar
      },
      timestamp: new Date().toISOString()
    };

    // Add immediately to UI
    setMessages(prev => [...prev, newMessageObj]);

    try {
      const { data, error } = await supabase
        .from('direct_messages')
        .insert({
          sender_id: currentUser.id,
          receiver_id: userId,
          text: messageToSend
        })
        .select('*')
        .single();

      if (error) {
        throw error;
      }

      console.log('Message sent successfully:', data);
      
      // Update the temporary message with the real one if needed
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
      
      // Remove the optimistic message on error
      setMessages(prev => prev.filter(msg => msg.id !== optimisticId));
    } finally {
      setIsSending(false);
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    try {
      // Optimistic UI update
      setMessages(prev => prev.filter(msg => msg.id !== messageId));
      
      const { error } = await supabase
        .from('direct_messages')
        .delete()
        .eq('id', messageId);

      if (error) {
        throw error;
      }
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
    <div className="flex flex-col h-full">
      <div className="border-b p-3 flex items-center">
        <div 
          className="flex items-center gap-3 cursor-pointer hover:opacity-80" 
          onClick={() => navigateToUserProfile(userId, userName, userAvatar)}
        >
          <UserAvatar name={userName} image={userAvatar} size="sm" />
          <h3 className="font-semibold">{userName}</h3>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <ChatMessages 
          messages={messages} 
          clubMembers={currentUser ? [currentUser] : []}
          onDeleteMessage={handleDeleteMessage}
          onSelectUser={(userId, userName, userAvatar) => 
            navigateToUserProfile(userId, userName, userAvatar)
          }
        />
      </div>
      
      <div className="sticky bottom-0 left-0 right-0 bg-white border-t">
        <ChatInput 
          onSendMessage={handleSendMessage}
          isSending={isSending}
          conversationId={userId}
          conversationType="dm"
        />
      </div>
    </div>
  );
};

export default DMConversation;
