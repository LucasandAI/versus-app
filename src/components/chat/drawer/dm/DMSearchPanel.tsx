
import React, { useState, useCallback } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import UserAvatar from '@/components/shared/UserAvatar';
import { useApp } from '@/context/AppContext';
import debounce from 'lodash/debounce';
import { toast } from '@/hooks/use-toast';

const DMSearchPanel: React.FC = () => {
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Array<{
    id: string;
    name: string;
    avatar: string;
  }>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { currentUser } = useApp();

  const searchUsers = useCallback(
    debounce(async (searchTerm: string) => {
      if (!searchTerm.trim()) {
        setSearchResults([]);
        return;
      }

      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('users')
          .select('id, name, avatar')
          .ilike('name', `%${searchTerm}%`)
          .neq('id', currentUser?.id)
          .limit(100);

        if (error) {
          throw error;
        }

        setSearchResults(data || []);
      } catch (error) {
        console.error('Error searching users:', error);
        toast({
          title: "Search failed",
          description: "Could not load search results",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    }, 300),
    [currentUser?.id]
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    searchUsers(value);
  };

  const handleSelectUser = async (userId: string) => {
    try {
      // First, check if a conversation already exists
      const { data: existingChats, error: chatError } = await supabase
        .from('direct_messages')
        .select('*')
        .or(`sender_id.eq.${currentUser?.id},receiver_id.eq.${currentUser?.id}`)
        .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
        .limit(1);

      if (chatError) {
        throw chatError;
      }

      // Clear the search results and input
      setSearchResults([]);
      setQuery('');

      // Trigger opening the chat with this user
      // Note: The parent component will need to handle this event
      const event = new CustomEvent('openDirectMessage', { 
        detail: { userId, hasExistingChat: existingChats && existingChats.length > 0 }
      });
      window.dispatchEvent(event);

    } catch (error) {
      console.error('Error checking existing chat:', error);
      toast({
        title: "Error",
        description: "Could not open conversation",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="p-4 border-b">
      <div className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            className="w-full pl-9 pr-4"
            placeholder="Search users to message..."
            value={query}
            onChange={handleInputChange}
          />
        </div>
        
        {(searchResults.length > 0 || isLoading) && (
          <div className="absolute z-10 mt-1 w-full bg-white rounded-md border shadow-lg max-h-60 overflow-auto">
            {isLoading ? (
              <div className="p-4 text-center text-gray-500">Searching...</div>
            ) : (
              <div className="py-2">
                {searchResults.map((user) => (
                  <div
                    key={user.id}
                    onClick={() => handleSelectUser(user.id)}
                    className="px-4 py-2 hover:bg-gray-50 flex items-center cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <UserAvatar
                        name={user.name}
                        image={user.avatar}
                        size="sm"
                      />
                      <span className="font-medium">{user.name}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DMSearchPanel;
