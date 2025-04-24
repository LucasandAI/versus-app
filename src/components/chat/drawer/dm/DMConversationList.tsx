
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useApp } from '@/context/AppContext';
import UserAvatar from '@/components/shared/UserAvatar';
import { Trash2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface DMConversationListProps {
  onSelectUser: (userId: string, userName: string, userAvatar?: string) => void;
  onDeleteChat?: (chatId: string, isTicket?: boolean) => void;
  selectedUserId?: string;
}

interface RecentConversation {
  userId: string;
  userName: string;
  userAvatar?: string;
  lastMessage?: string;
  timestamp?: string;
}

const DMConversationList: React.FC<DMConversationListProps> = ({ 
  onSelectUser,
  onDeleteChat,
  selectedUserId
}) => {
  const [recentConversations, setRecentConversations] = useState<RecentConversation[]>([]);
  const [loading, setLoading] = useState(true);
  const { currentUser } = useApp();
  
  useEffect(() => {
    const fetchRecentConversations = async () => {
      if (!currentUser?.id) return;
      
      setLoading(true);
      try {
        // Get unique users from direct messages where current user is either sender or receiver
        const { data: messageData, error: messageError } = await supabase
          .from('direct_messages')
          .select('sender_id, receiver_id, text, timestamp')
          .or(`sender_id.eq.${currentUser.id},receiver_id.eq.${currentUser.id}`)
          .order('timestamp', { ascending: false });
          
        if (messageError) throw messageError;
        
        // Extract unique user IDs (excluding current user)
        const uniqueUserIds = new Set<string>();
        messageData?.forEach(msg => {
          if (msg.sender_id === currentUser.id) {
            uniqueUserIds.add(msg.receiver_id);
          } else {
            uniqueUserIds.add(msg.sender_id);
          }
        });
        
        // Fetch user details for each unique user ID
        const conversations: RecentConversation[] = [];
        for (const userId of uniqueUserIds) {
          const { data: userData, error: userError } = await supabase
            .from('users')
            .select('id, name, avatar')
            .eq('id', userId)
            .single();
            
          if (userError) {
            console.error('Error fetching user:', userError);
            continue;
          }
          
          if (userData) {
            // Find the last message for this conversation
            const lastMessage = messageData?.find(msg => 
              (msg.sender_id === userId && msg.receiver_id === currentUser.id) ||
              (msg.sender_id === currentUser.id && msg.receiver_id === userId)
            );
            
            conversations.push({
              userId: userData.id,
              userName: userData.name,
              userAvatar: userData.avatar,
              lastMessage: lastMessage?.text,
              timestamp: lastMessage?.timestamp
            });
          }
        }
        
        // Sort by most recent message first
        conversations.sort((a, b) => {
          if (!a.timestamp) return 1;
          if (!b.timestamp) return -1;
          return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
        });
        
        setRecentConversations(conversations);
      } catch (error) {
        console.error('Error fetching recent conversations:', error);
        toast({
          title: "Error",
          description: "Could not load recent conversations",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchRecentConversations();
  }, [currentUser?.id]);
  
  if (loading) {
    return <div className="p-4 text-center text-gray-500">Loading conversations...</div>;
  }
  
  if (recentConversations.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500">
        <p>No recent conversations</p>
        <p className="text-sm mt-2">Search for users to start chatting</p>
      </div>
    );
  }
  
  return (
    <div className="overflow-y-auto">
      <h3 className="font-medium text-sm text-gray-500 px-4 py-2">Recent Conversations</h3>
      {recentConversations.map((conversation) => (
        <div 
          key={conversation.userId}
          className={`px-4 py-2 hover:bg-gray-100 flex items-center justify-between cursor-pointer ${
            selectedUserId === conversation.userId ? 'bg-gray-100' : ''
          }`}
          onClick={() => onSelectUser(conversation.userId, conversation.userName, conversation.userAvatar)}
        >
          <div className="flex items-center gap-3 overflow-hidden">
            <UserAvatar
              name={conversation.userName}
              image={conversation.userAvatar}
              size="sm"
            />
            <div className="overflow-hidden">
              <p className="font-medium text-sm truncate">{conversation.userName}</p>
              {conversation.lastMessage && (
                <p className="text-xs text-gray-500 truncate">{conversation.lastMessage}</p>
              )}
            </div>
          </div>
          {onDeleteChat && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (onDeleteChat) {
                  onDeleteChat(conversation.userId, false);
                }
              }}
              className="text-gray-400 hover:text-red-500 p-1"
              aria-label="Delete conversation"
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>
      ))}
    </div>
  );
};

export default DMConversationList;
