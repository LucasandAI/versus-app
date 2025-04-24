
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useApp } from '@/context/AppContext';
import { X } from 'lucide-react';
import UserAvatar from '@/components/shared/UserAvatar';
import { toast } from '@/hooks/use-toast';
import { useHiddenDMs } from '@/hooks/chat/useHiddenDMs';

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
  const { hideConversation, isConversationHidden } = useHiddenDMs();
  
  useEffect(() => {
    const loadConversations = async () => {
      try {
        if (!currentUser?.id) return;

        const { data: messages, error: messagesError } = await supabase
          .from('direct_messages')
          .select('id, sender_id, receiver_id, text, timestamp')
          .or(`sender_id.eq.${currentUser.id},receiver_id.eq.${currentUser.id}`)
          .order('timestamp', { ascending: false });

        if (messagesError) throw messagesError;
        if (!messages || messages.length === 0) return;

        const uniqueUserIds = new Set<string>();
        messages.forEach(msg => {
          const otherUserId = msg.sender_id === currentUser.id ? msg.receiver_id : msg.sender_id;
          uniqueUserIds.add(otherUserId);
        });

        const { data: users, error: usersError } = await supabase
          .from('users')
          .select('id, name, avatar')
          .in('id', Array.from(uniqueUserIds));
        
        if (usersError) throw usersError;
        if (!users) return;

        const userMap = users.reduce((map: Record<string, any>, user) => {
          map[user.id] = user;
          return map;
        }, {});

        const conversationsMap = new Map<string, DMConversation>();
        
        messages.forEach(msg => {
          const otherUserId = msg.sender_id === currentUser.id ? msg.receiver_id : msg.sender_id;
          const otherUser = userMap[otherUserId];
          
          if (otherUser && !conversationsMap.has(otherUserId)) {
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

  const handleHideConversation = (
    e: React.MouseEvent,
    userId: string
  ) => {
    e.stopPropagation();
    hideConversation(userId);
  };

  const visibleConversations = conversations.filter(
    conv => !isConversationHidden(conv.userId)
  );

  return (
    <div className="flex flex-col space-y-2 p-4">
      <h2 className="font-semibold text-lg mb-2">Messages</h2>
      {visibleConversations.map((conversation) => (
        <button
          key={conversation.userId}
          onClick={() => onSelectUser(conversation.userId, conversation.userName, conversation.userAvatar)}
          className={`flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100 transition-colors w-full text-left group ${
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
          <button
            onClick={(e) => handleHideConversation(e, conversation.userId)}
            className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-200 rounded transition-all"
            aria-label="Hide conversation"
          >
            <X className="h-4 w-4 text-gray-500" />
          </button>
        </button>
      ))}
      {visibleConversations.length === 0 && (
        <p className="text-center text-gray-500 py-4">No conversations yet</p>
      )}
    </div>
  );
};

export default DMConversationList;
