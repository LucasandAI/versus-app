
import React from 'react';
import { useHiddenDMs } from '@/hooks/chat/useHiddenDMs';
import ConversationItem from './ConversationItem';
import { useConversations } from '@/hooks/chat/dm/useConversations';
import SearchBar from './SearchBar';
import { useUserSearch } from '@/hooks/chat/dm/useUserSearch';

interface Props {
  onSelectUser: (userId: string, userName: string, userAvatar?: string) => void;
  selectedUserId?: string;
}

const DMConversationList: React.FC<Props> = ({ onSelectUser, selectedUserId }) => {
  const { hideConversation, hiddenDMs } = useHiddenDMs();
  const { conversations } = useConversations(hiddenDMs);
  const { query, setQuery, searchUsers } = useUserSearch();
  
  const handleHideConversation = (
    e: React.MouseEvent,
    userId: string
  ) => {
    e.stopPropagation();
    console.log('[DMConversationList] Hiding conversation for userId:', userId);
    hideConversation(userId);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    searchUsers(value);
  };

  return (
    <div className="flex flex-col h-full bg-white">
      <h1 className="text-4xl font-bold p-4">Messages</h1>
      <SearchBar 
        value={query} 
        onChange={handleSearchChange} 
        showResults={false} 
      />
      
      <div className="flex-1 overflow-auto">
        {conversations.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            <p className="text-lg">No messages yet</p>
            <p className="text-sm mt-1">Search above to start a conversation</p>
          </div>
        ) : (
          <div className="divide-y">
            {conversations.map((conversation) => (
              <ConversationItem
                key={conversation.userId}
                conversation={conversation}
                isSelected={selectedUserId === conversation.userId}
                onSelect={() => onSelectUser(
                  conversation.userId,
                  conversation.userName,
                  conversation.userAvatar
                )}
                onHide={(e) => handleHideConversation(e, conversation.userId)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DMConversationList;
