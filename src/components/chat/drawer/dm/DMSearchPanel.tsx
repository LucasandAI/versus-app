
import React, { useState } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ArrowLeft } from 'lucide-react';
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

  const handleBack = () => {
    setSelectedDMUser(null);
  };

  return (
    <div className="flex h-full w-full">
      {!selectedDMUser ? (
        <div className="w-full flex flex-col h-full">
          <div className="sticky top-0 z-10 bg-white border-b">
            <div ref={searchContainerRef} className="relative p-4">
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
          </div>
          
          <ScrollArea className="flex-1">
            <DMConversationList 
              onSelectUser={handleSelectUser}
              selectedUserId={selectedDMUser?.id}
            />
          </ScrollArea>
        </div>
      ) : (
        <div className="flex flex-col h-full w-full">
          <div className="border-b p-3 flex items-center">
            <button 
              onClick={handleBack}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            
            <div className="flex-1 flex justify-center">
              <h3 className="font-semibold">{selectedDMUser.name}</h3>
            </div>
            
            <div className="w-9" /> {/* Spacer for alignment */}
          </div>
          
          <div className="flex-1">
            <DMConversation 
              userId={selectedDMUser.id}
              userName={selectedDMUser.name}
              userAvatar={selectedDMUser.avatar}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default DMSearchPanel;
