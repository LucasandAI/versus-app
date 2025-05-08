
import React, { useState } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useFormatRelativeTime } from '@/hooks/useFormatRelativeTime';

interface DMConversationUser {
  id: string;
  name: string;
  avatar?: string;
}

interface DMConversationItem {
  id: string;
  user: DMConversationUser;
  lastMessage?: string;
  timestamp?: string;
  unread: boolean;
}

interface DMConversationListProps {
  conversations: DMConversationItem[];
  onSelectConversation: (conversation: { id: string; user: DMConversationUser }) => void;
  unreadConversations: Set<string>;
  loading?: boolean;
}

const DMConversationList: React.FC<DMConversationListProps> = ({
  conversations,
  onSelectConversation,
  unreadConversations,
  loading = false
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const { formatRelativeTime } = useFormatRelativeTime();
  
  const filteredConversations = searchQuery 
    ? conversations.filter(conversation => 
        conversation.user.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : conversations;

  // Sort conversations: first by unread status, then by most recent
  const sortedConversations = [...filteredConversations].sort((a, b) => {
    // Unread conversations come first
    if (unreadConversations.has(a.id) && !unreadConversations.has(b.id)) return -1;
    if (!unreadConversations.has(a.id) && unreadConversations.has(b.id)) return 1;
    
    // Then sort by timestamp (most recent first)
    if (a.timestamp && b.timestamp) {
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    }
    
    // If no timestamp, put those without timestamps last
    if (a.timestamp && !b.timestamp) return -1;
    if (!a.timestamp && b.timestamp) return 1;
    
    // If neither has timestamp, sort by name
    return a.user.name.localeCompare(b.user.name);
  });
  
  if (loading) {
    return (
      <div>
        <div className="p-4 pb-2">
          <Skeleton className="w-full h-10" />
        </div>
        {[1, 2, 3].map(i => (
          <div key={i} className="p-4 flex items-center gap-3">
            <Skeleton className="w-10 h-10 rounded-full" />
            <div className="flex-1">
              <Skeleton className="w-24 h-4 mb-2" />
              <Skeleton className="w-40 h-3" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div>
      <div className="p-4 pb-2">
        <Input
          placeholder="Search conversations..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full"
          prefix={<Search className="h-4 w-4 text-gray-400" />}
        />
      </div>
      
      <div className="overflow-y-auto max-h-[calc(80vh-120px)]">
        {sortedConversations.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            {searchQuery ? "No conversations found" : "No direct messages yet"}
          </div>
        ) : (
          sortedConversations.map(conversation => (
            <Button
              key={conversation.id}
              variant="ghost"
              className="w-full flex items-center gap-3 px-4 py-3 justify-start rounded-none"
              onClick={() => onSelectConversation(conversation)}
            >
              <div className="w-10 h-10 rounded-full bg-gray-200 flex-shrink-0">
                {conversation.user.avatar && (
                  <img 
                    src={conversation.user.avatar} 
                    alt={conversation.user.name}
                    className="w-full h-full rounded-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                )}
              </div>
              <div className="flex-1 text-left truncate">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{conversation.user.name}</span>
                  {unreadConversations.has(conversation.id) && (
                    <span className="w-2 h-2 bg-primary rounded-full"></span>
                  )}
                </div>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span className="truncate max-w-[160px]">
                    {conversation.lastMessage || 'Start chatting...'}
                  </span>
                  {conversation.timestamp && (
                    <span className="ml-2 flex-shrink-0">
                      {formatRelativeTime(conversation.timestamp)}
                    </span>
                  )}
                </div>
              </div>
            </Button>
          ))
        )}
      </div>
    </div>
  );
};

export default DMConversationList;
