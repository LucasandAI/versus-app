
import React, { useState, useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import DMConversationList from './DMConversationList';
import DMConversation from './DMConversation';
import { useHiddenDMs } from '@/hooks/chat/useHiddenDMs';
import UserAvatar from '@/components/shared/UserAvatar';

type SelectedUser = {
  id: string;
  name: string;
  avatar?: string;
} | null;

interface DMContainerProps {
  initialSelectedUser?: SelectedUser;
  setDirectMessageUser?: React.Dispatch<React.SetStateAction<SelectedUser>>;
}

const DMContainer: React.FC<DMContainerProps> = ({ 
  initialSelectedUser = null,
  setDirectMessageUser
}) => {
  const [selectedUser, setSelectedUser] = useState<SelectedUser>(initialSelectedUser);
  const { hideConversation, hiddenDMs } = useHiddenDMs();

  // Apply initialSelectedUser when it changes, this handles the case
  // when a user clicks on "Message" from a profile
  useEffect(() => {
    if (initialSelectedUser) {
      console.log('[DMContainer] Setting initial selected user:', initialSelectedUser.name);
      setSelectedUser(initialSelectedUser);
    }
  }, [initialSelectedUser]);

  const handleSelectUser = (userId: string, userName: string, userAvatar?: string) => {
    const user = {
      id: userId,
      name: userName,
      avatar: userAvatar
    };
    setSelectedUser(user);
    if (setDirectMessageUser) {
      setDirectMessageUser(user);
    }
  };

  const handleGoBack = () => {
    setSelectedUser(null);
    if (setDirectMessageUser) {
      setDirectMessageUser(null);
    }
  };

  // Listen for openDirectMessage events 
  useEffect(() => {
    const handleOpenDM = (event: CustomEvent<{userId: string, userName: string, userAvatar?: string}>) => {
      const { userId, userName, userAvatar } = event.detail;
      handleSelectUser(userId, userName, userAvatar);
    };

    window.addEventListener('openDirectMessage', handleOpenDM as EventListener);
    return () => {
      window.removeEventListener('openDirectMessage', handleOpenDM as EventListener);
    };
  }, []);

  return (
    <div className="flex flex-col h-full w-full">
      {!selectedUser ? (
        // Conversation list view
        <DMConversationList 
          onSelectUser={handleSelectUser}
          selectedUserId={null}
        />
      ) : (
        // Single conversation view
        <div className="flex flex-col h-full">
          {/* Conversation header */}
          <div className="border-b p-3 flex items-center">
            <button 
              onClick={handleGoBack}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            
            <div className="flex-1 flex justify-center items-center">
              <div className="flex items-center gap-2">
                <UserAvatar 
                  name={selectedUser.name} 
                  image={selectedUser.avatar} 
                  size="sm" 
                />
                <h3 className="font-semibold">{selectedUser.name}</h3>
              </div>
            </div>
            
            {/* Placeholder for future menu */}
            <div className="w-9"></div>
          </div>
          
          {/* Conversation content */}
          <div className="flex-1 overflow-hidden">
            <DMConversation
              userId={selectedUser.id}
              userName={selectedUser.name}
              userAvatar={selectedUser.avatar}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default DMContainer;
