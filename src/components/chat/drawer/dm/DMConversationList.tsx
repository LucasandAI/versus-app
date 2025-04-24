
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useApp } from '@/context/AppContext';
import UserAvatar from '@/components/shared/UserAvatar';
import { toast } from '@/hooks/use-toast';

interface DMConversation {
  userId: string;
  userName: string;
  userAvatar?: string;
  lastMessage?: string;
  timestamp?: string;
}

interface Props {
  onSelectUser: (userId: string, userName: string, userAvatar?: string) => void;
  selectedUserId?: string;
}

const DMConversationList: React.FC<Props> = ({ onSelectUser, selectedUserId }) => {
  const [conversations, setConversations] = useState<DMConversation[]>([]);
  const { currentUser } = useApp();
  
  useEffect(() => {
    const loadConversations = async () => {
      try {
        // Get all conversations where the current user is either sender or receiver
        const { data: messages, error } = await supabase
          .from('direct_messages')
          .select(`
            id,
            sender_id,
            receiver_id,
            text,
            timestamp,
            sender:sender_id(name, avatar),
            receiver:receiver_id(name, avatar)
          `)
          .or(`sender_id.eq.${currentUser?.id},receiver_id.eq.${currentUser?.id}`)
          .order('timestamp', { ascending: false });

        if (error) throw error;

        // Process messages to get unique conversations
        const conversationsMap = new Map<string, DMConversation>();
        
        messages?.forEach(msg => {
          const otherUserId = msg.sender_id === currentUser?.id ? msg.receiver_id : msg.sender_id;
          const otherUser = msg.sender_id === currentUser?.id ? msg.receiver : msg.sender;
          
          if (!conversationsMap.has(otherUserId)) {
            conversationsMap.set(otherUserId, {
              userId: otherUserId,
              userName: otherUser.name,
              userAvatar: otherUser.avatar,
              lastMessage: msg.text,
              timestamp: msg.timestamp
            });
          }
        });

        setConversations(Array.from(conversationsMap.values()));
      } catch (error) {
        console.error('Error loading conversations:', error);
        toast({
          title: "Error",
          description: "Could not load conversations",
          variant: "destructive"
        });
      }
    };

    if (currentUser?.id) {
      loadConversations();
    }
  }, [currentUser?.id]);

  return (
    <div className="flex flex-col space-y-2 p-4">
      {conversations.map((conversation) => (
        <button
          key={conversation.userId}
          onClick={() => onSelectUser(conversation.userId, conversation.userName, conversation.userAvatar)}
          className={`flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100 transition-colors w-full text-left ${
            selectedUserId === conversation.userId ? 'bg-gray-100' : ''
          }`}
        >
          <UserAvatar
            name={conversation.userName}
            image={conversation.userAvatar}
            size="sm"
          />
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">{conversation.userName}</p>
            {conversation.lastMessage && (
              <p className="text-sm text-gray-500 truncate">{conversation.lastMessage}</p>
            )}
          </div>
        </button>
      ))}
      {conversations.length === 0 && (
        <p className="text-center text-gray-500 py-4">No conversations yet</p>
      )}
    </div>
  );
};

export default DMConversationList;
