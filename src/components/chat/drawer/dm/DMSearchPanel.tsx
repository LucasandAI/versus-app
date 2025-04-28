
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
    // If we don't have a conversation ID yet, check if one exists or create a new one
    if (!existingConversationId && currentUser?.id) {
      try {
        // Check for existing conversation (in both directions)
        const { data: existingConversation, error: fetchError } = await supabase
          .from('direct_conversations')
          .select('id')
          .or(`user1_id.eq.${currentUser.id},user2_id.eq.${currentUser.id}`)
          .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
          .maybeSingle();

        if (fetchError) throw fetchError;

        if (existingConversation) {
          // Use existing conversation
          existingConversationId = existingConversation.id;
        } else {
          // Create new conversation
          const newConversationId = `${currentUser.id}_${userId}_${Date.now()}`;
          const { error: insertError } = await supabase
            .from('direct_conversations')
            .insert({
              id: newConversationId,
              user1_id: currentUser.id,
              user2_id: userId
            });

          if (insertError) throw insertError;
          existingConversationId = newConversationId;
        }
      } catch (error) {
        console.error("Error handling conversation:", error);
        toast({
          title: "Error",
          description: "Could not start conversation",
          variant: "destructive"
        });
        return;
      }
    }

    setSelectedDMUser({
      id: userId,
      name: userName,
      avatar: userAvatar,
      conversationId: existingConversationId
    });
    clearSearch();
  };

  const handleBack = () => {
    setSelectedDMUser(null);
  };

  const handleUserProfileClick = () => {
    if (selectedDMUser) {
      navigateToUserProfile(selectedDMUser.id, selectedDMUser.name, selectedDMUser.avatar);
    }
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
            {selectedDMUser.conversationId ? (
              <DMConversation
                userId={selectedDMUser.id}
                userName={selectedDMUser.name}
                userAvatar={selectedDMUser.avatar || '/placeholder.svg'}
                conversationId={selectedDMUser.conversationId}
              />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                Loading conversation...
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DMSearchPanel;
