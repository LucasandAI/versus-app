
import React, { useState } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ArrowLeft } from 'lucide-react';
import SearchBar from './SearchBar';
import UserSearchResults from './UserSearchResults';
import DMConversationList from './DMConversationList';
import DMConversation from './DMConversation';
import { useUserSearch } from '@/hooks/chat/dm/useUserSearch';
import { useClickOutside } from '@/hooks/use-click-outside';
import { useNavigation } from '@/hooks/useNavigation';
import UserAvatar from '@/components/shared/UserAvatar';
import { supabase } from '@/integrations/supabase/client';
import { useApp } from '@/context/AppContext';
import { toast } from '@/hooks/use-toast';

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
    conversationId?: string; // Added conversationId (optional for new users)
  } | null>(null);

  const { navigateToUserProfile } = useNavigation();
  const { currentUser } = useApp();

  const searchContainerRef = useClickOutside(() => {
    setShowResults(false);
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    setShowResults(true);
    searchUsers(value);
  };

  const handleSelectUser = async (userId: string, userName: string, userAvatar?: string, existingConversationId?: string) => {
    // Immediately set the selected user to show the conversation UI
    setSelectedDMUser({
      id: userId,
      name: userName,
      avatar: userAvatar,
      // If we don't have a conversation ID yet, use 'new' as a placeholder
      conversationId: existingConversationId || 'new'
    });
    clearSearch();

    // We don't need to check for an existing conversation here anymore
    // That will be handled when the first message is sent
    console.log('Selected user for DM:', userName, 'with conversation:', existingConversationId || 'new');
  };

  const handleBack = () => {
    setSelectedDMUser(null);
  };

  const handleUserProfileClick = () => {
    if (selectedDMUser) {
      navigateToUserProfile(selectedDMUser.id, selectedDMUser.name, selectedDMUser.avatar);
    }
  };

  // Listen for conversation creation events
  React.useEffect(() => {
    const handleConversationCreated = (event: CustomEvent) => {
      const { userId, conversationId } = event.detail;
      console.log('Conversation created event received:', userId, conversationId);
      
      if (selectedDMUser && selectedDMUser.id === userId) {
        setSelectedDMUser(prev => prev ? {
          ...prev,
          conversationId
        } : null);
      }
    };

    window.addEventListener('conversationCreated', handleConversationCreated as EventListener);
    return () => {
      window.removeEventListener('conversationCreated', handleConversationCreated as EventListener);
    };
  }, [selectedDMUser]);

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
            
            <div 
              className="flex-1 flex justify-center items-center gap-3 cursor-pointer hover:opacity-80"
              onClick={handleUserProfileClick}
            >
              <UserAvatar name={selectedDMUser.name} image={selectedDMUser.avatar} size="sm" />
              <h3 className="font-semibold">{selectedDMUser.name}</h3>
            </div>
            
            <div className="w-9" /> {/* Spacer for alignment */}
          </div>
          
          <div className="flex-1">
            <DMConversation
              userId={selectedDMUser.id}
              userName={selectedDMUser.name}
              userAvatar={selectedDMUser.avatar || '/placeholder.svg'}
              conversationId={selectedDMUser.conversationId || 'new'}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default DMSearchPanel;
