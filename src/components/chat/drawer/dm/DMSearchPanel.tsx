
import React, { useState, useRef } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import SearchBar from './SearchBar';
import UserSearchResults from './UserSearchResults';
import DMConversationList from './DMConversationList';
import DMConversation from './DMConversation';
import { useUserSearch } from '@/hooks/chat/dm/useUserSearch';
import { useClickOutside } from '@/hooks/use-click-outside';

const DMSearchPanel: React.FC = () => {
  const { 
    query, 
    setQuery, 
    searchResults, 
    isLoading, 
    searchUsers,
    clearSearch,
    showResults,
    setShowResults
  } = useUserSearch();

  const [selectedDMUser, setSelectedDMUser] = useState<{
    id: string;
    name: string;
    avatar?: string;
  } | null>(null);

  const searchContainerRef = useClickOutside(() => {
    setShowResults(false);
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    setShowResults(true);
    searchUsers(value);
  };

  const handleSelectUser = async (userId: string, userName: string, userAvatar?: string) => {
    setSelectedDMUser({
      id: userId,
      name: userName,
      avatar: userAvatar
    });
    clearSearch();
  };

  return (
    <div className="flex h-full w-full">
      <div className="w-[240px] border-r flex flex-col h-full">
        <div ref={searchContainerRef} className="relative">
          <SearchBar 
            value={query} 
            onChange={handleInputChange}
            onFocus={() => setShowResults(true)}
            showResults={showResults}
          />
          
          <UserSearchResults
            results={searchResults}
            isLoading={isLoading}
            onSelectUser={handleSelectUser}
            visible={showResults}
          />
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
