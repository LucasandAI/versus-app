
import React, { useState } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import SearchBar from './SearchBar';
import UserSearchResults from './UserSearchResults';
import DMConversationList from './DMConversationList';
import DMConversation from './DMConversation';
import { useUserSearch } from '@/hooks/chat/dm/useUserSearch';

const DMSearchPanel: React.FC = () => {
  const { 
    query, 
    setQuery, 
    searchResults, 
    isLoading, 
    searchUsers,
    clearSearch 
  } = useUserSearch();

  const [selectedDMUser, setSelectedDMUser] = useState<{
    id: string;
    name: string;
    avatar?: string;
  } | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    searchUsers(value);
  };

  const handleSelectUser = async (userId: string, userName: string, userAvatar?: string) => {
    setSelectedDMUser({
      id: userId,
      name: userName,
      avatar: userAvatar
    });
    clearSearch(); // Clear both query and results
  };

  return (
    <div className="flex h-full w-full">
      <div className="w-[240px] border-r flex flex-col h-full">
        <div className="p-4 border-b relative">
          <SearchBar value={query} onChange={handleInputChange} />
          
          {(searchResults.length > 0 || isLoading) && (
            <div className="absolute z-10 mt-1 w-[216px] bg-white rounded-md border shadow-lg max-h-60 overflow-auto">
              <UserSearchResults
                results={searchResults}
                isLoading={isLoading}
                onSelectUser={handleSelectUser}
              />
            </div>
          )}
        </div>
        
        <ScrollArea className="flex-1">
          <DMConversationList 
            onSelectUser={handleSelectUser}
            selectedUserId={selectedDMUser?.id}
          />
        </ScrollArea>
      </div>

      <div className="flex-1 h-full">
        {!selectedDMUser ? (
          <div className="h-full flex items-center justify-center">
            <p className="text-gray-500">Select a conversation or search for a user to message</p>
          </div>
        ) : (
          <DMConversation 
            userId={selectedDMUser.id}
            userName={selectedDMUser.name}
            userAvatar={selectedDMUser.avatar}
          />
        )}
      </div>
    </div>
  );
};

export default DMSearchPanel;
