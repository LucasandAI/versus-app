
import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { supabase } from '@/integrations/supabase/client';
import { ChatMessage } from '@/types/chat';
import MessageList from '../../message/MessageList';
import ChatInput from '../../ChatInput';
import DMChatHeader from './DMChatHeader';

interface DMChatContentProps {
  selectedUserId: string;
  selectedUserName: string;
  selectedUserAvatar?: string;
  onClose?: () => void;
}

const DMChatContent: React.FC<DMChatContentProps> = ({
  selectedUserId,
  selectedUserName,
  selectedUserAvatar,
  onClose
}) => {
  const { currentUser } = useApp();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!currentUser || !selectedUserId) return;

    const fetchMessages = async () => {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('direct_messages')
        .select('*')
        .or(`and(sender_id.eq.${currentUser.id},receiver_id.eq.${selectedUserId}),and(sender_id.eq.${selectedUserId},receiver_id.eq.${currentUser.id})`)
        .order('timestamp', { ascending: true });

      if (error) {
        console.error('Error fetching messages:', error);
        return;
      }

      const formattedMessages = data.map((msg): ChatMessage => ({
        id: msg.id,
        text: msg.text,
        sender: {
          id: msg.sender_id,
          name: msg.sender_id === currentUser.id ? currentUser.name : selectedUserName,
          avatar: msg.sender_id === currentUser.id ? currentUser.avatar : selectedUserAvatar
        },
        timestamp: msg.timestamp
      }));

      setMessages(formattedMessages);
      setIsLoading(false);
    };

    fetchMessages();

    // Subscribe to new messages
    const channel = supabase
      .channel('direct_messages')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'direct_messages',
        filter: `or(and(sender_id=eq.${currentUser.id},receiver_id=eq.${selectedUserId}),and(sender_id=eq.${selectedUserId},receiver_id=eq.${currentUser.id}))`,
      }, (payload) => {
        const newMessage: ChatMessage = {
          id: payload.new.id,
          text: payload.new.text,
          sender: {
            id: payload.new.sender_id,
            name: payload.new.sender_id === currentUser.id ? currentUser.name : selectedUserName,
            avatar: payload.new.sender_id === currentUser.id ? currentUser.avatar : selectedUserAvatar
          },
          timestamp: payload.new.timestamp
        };
        setMessages(prev => [...prev, newMessage]);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUser, selectedUserId, selectedUserName, selectedUserAvatar]);

  const handleSendMessage = async (text: string) => {
    if (!currentUser || !selectedUserId) return;

    const { error } = await supabase
      .from('direct_messages')
      .insert({
        sender_id: currentUser.id,
        receiver_id: selectedUserId,
        text
      });

    if (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    const { error } = await supabase
      .from('direct_messages')
      .delete()
      .eq('id', messageId);

    if (error) {
      console.error('Error deleting message:', error);
      return;
    }

    setMessages(prev => prev.filter(msg => msg.id !== messageId));
  };

  return (
    <div className="flex flex-col h-full">
      <DMChatHeader 
        title={selectedUserName}
        avatar={selectedUserAvatar}
        onClose={onClose || (() => {})}
      />
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <MessageList
          messages={messages}
          clubMembers={[
            { id: currentUser?.id || '', name: currentUser?.name || '', avatar: currentUser?.avatar },
            { id: selectedUserId, name: selectedUserName, avatar: selectedUserAvatar }
          ]}
          onDeleteMessage={handleDeleteMessage}
          formatTime={(isoString) => new Date(isoString).toLocaleTimeString()}
          currentUserAvatar={currentUser?.avatar || ''}
        />
      </div>

      <ChatInput onSendMessage={handleSendMessage} />
    </div>
  );
};

export default DMChatContent;
