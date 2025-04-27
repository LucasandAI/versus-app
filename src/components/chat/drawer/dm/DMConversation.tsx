
import React from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useApp } from '@/context/AppContext';
import ChatMessages from '../../ChatMessages';
import ChatInput from '../../ChatInput';
import DMHeader from './DMHeader';
import { useDMMessages } from '@/hooks/chat/dm/useDMMessages';
import { useDMSubscription } from '@/hooks/chat/dm/useDMSubscription';
import { useNavigation } from '@/hooks/useNavigation';
import { toast } from '@/hooks/use-toast';
import { useHiddenDMs } from '@/hooks/chat/useHiddenDMs';
import { useConversations } from '@/hooks/chat/dm/useConversations';

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
  const { 
    messages, 
    setMessages, 
    isSending, 
    setIsSending 
  } = useDMMessages(userId, userName);
  
  const { unhideConversation, hiddenDMs } = useHiddenDMs();
  const { fetchConversations } = useConversations(hiddenDMs);

  useDMSubscription(userId, currentUser?.id, setMessages);

  const handleSendMessage = async (message: string) => {
    if (!message.trim() || !currentUser?.id || !userId) return;
    setIsSending(true);
    
    // Unhide the conversation to ensure it appears in the sidebar
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

    setMessages(prev => [...prev, newMessageObj]);

    try {
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
        
        // Manually refresh conversations to immediately update the sidebar
        fetchConversations();
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
      <DMHeader userId={userId} userName={userName} userAvatar={userAvatar} />
      
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        <div className="flex-1 min-h-0">
          <ChatMessages 
            messages={messages} 
            clubMembers={currentUser ? [currentUser] : []}
            onDeleteMessage={handleDeleteMessage}
            onSelectUser={(userId, userName, userAvatar) => 
              navigateToUserProfile(userId, userName, userAvatar)
            }
          />
        </div>
        
        <div className="absolute bottom-0 left-0 right-0 bg-white">
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
