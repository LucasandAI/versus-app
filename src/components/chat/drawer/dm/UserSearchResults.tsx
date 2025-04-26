
import React from 'react';
import UserAvatar from '@/components/shared/UserAvatar';
import { useHiddenDMs } from '@/hooks/chat/useHiddenDMs';

interface SearchResult {
  id: string;
  name: string;
  avatar: string;
}

interface UserSearchResultsProps {
  results: SearchResult[];
  isLoading: boolean;
  onSelectUser: (userId: string, userName: string, userAvatar?: string) => void;
  onCloseSearch: () => void;
}

const UserSearchResults: React.FC<UserSearchResultsProps> = ({
  results,
  isLoading,
  onSelectUser,
  onCloseSearch
}) => {
  const { unhideConversation } = useHiddenDMs();

  const handleUserSelect = (user: SearchResult) => {
    unhideConversation(user.id); // Make sure conversation is visible in the list
    onSelectUser(user.id, user.name, user.avatar);
    onCloseSearch(); // Close the search results
  };

  if (isLoading) {
    return <div className="p-4 text-center text-gray-500">Searching...</div>;
  }

  return (
    <div className="py-2">
      {results.map((user) => (
        <div
          key={user.id}
          onClick={() => handleUserSelect(user)}
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
  );
};

export default UserSearchResults;
