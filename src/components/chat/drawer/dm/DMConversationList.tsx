
import React, { useState } from 'react';
import { Search, UserPlus } from 'lucide-react';
import UserAvatar from '@/components/shared/UserAvatar';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useFormatRelativeTime } from '@/hooks/useFormatRelativeTime';

interface DMConversationListProps {
  conversations: Array<{
    id: string;
    user: {
      id: string;
      name: string;
      avatar?: string;
    };
    lastMessage?: string;
    timestamp?: string;
    unread: boolean;
  }>;
  onSelectConversation: (conversation: {
    id: string;
    user: {
      id: string;
      name: string;
      avatar?: string;
    };
  }) => void;
}

const DMConversationList: React.FC<DMConversationListProps> = ({ conversations, onSelectConversation }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const { formatRelativeTime } = useFormatRelativeTime();
  
  const filteredConversations = conversations.filter(c => 
    c.user.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const startNewConversation = () => {
    // Open a dialog to select user or trigger an event to handle this
    const event = new CustomEvent('openUserDirectoryDialog');
    window.dispatchEvent(event);
  };
  
  return (
    <div className="h-full flex flex-col">
      <div className="p-3 border-b">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input 
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        {filteredConversations.length === 0 ? (
          <div className="p-5 text-center text-gray-500">
            {searchQuery ? 
              "No conversations found" : 
              "No conversations yet. Start a new one."}
          </div>
        ) : (
          <div className="divide-y">
            {filteredConversations.map((conversation) => (
              <button
                key={conversation.id}
                className={`w-full p-3 flex items-center hover:bg-gray-100 transition-colors ${
                  conversation.unread ? 'bg-gray-50' : ''
                }`}
                onClick={() => onSelectConversation(conversation)}
              >
                <div className="relative">
                  <UserAvatar 
                    name={conversation.user.name} 
                    image={conversation.user.avatar} 
                    size="md" 
                  />
                  {conversation.unread && (
                    <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full border-2 border-white"></span>
                  )}
                </div>
                <div className="ml-3 flex-1 text-left">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{conversation.user.name}</span>
                    {conversation.timestamp && (
                      <span className="text-xs text-gray-500">
                        {formatRelativeTime(conversation.timestamp)}
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-gray-500 truncate max-w-[200px]">
                    {conversation.lastMessage || "No messages yet"}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
      
      <div className="p-3 border-t">
        <button 
          onClick={startNewConversation}
          className="w-full bg-primary text-white py-2 px-4 rounded flex items-center justify-center"
        >
          <UserPlus className="w-4 h-4 mr-2" />
          New Conversation
        </button>
      </div>
    </div>
  );
};

export default DMConversationList;
