
import React, { useState, useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import DMConversationList from './DMConversationList';
import DMConversation from './DMConversation';
import { useHiddenDMs } from '@/hooks/chat/useHiddenDMs';
import UserAvatar from '@/components/shared/UserAvatar';
import DMSearchPanel from './DMSearchPanel';

type SelectedUser = {
  id: string;
  name: string;
  avatar?: string;
  conversationId?: string;
} | null;

interface DMContainerProps {
  initialSelectedUser?: {
    userId: string;
    userName: string;
    userAvatar?: string;
    conversationId?: string;
  } | null;
  setDirectMessageUser?: React.Dispatch<React.SetStateAction<{
    userId: string;
    userName: string;
    userAvatar?: string;
    conversationId?: string;
  } | null>>;
  directMessageUser?: {
    userId: string;
    userName: string;
    userAvatar?: string;
    conversationId?: string;
  } | null;
}

const DMContainer: React.FC<DMContainerProps> = ({ 
  initialSelectedUser = null,
  setDirectMessageUser,
  directMessageUser
}) => {
  // Convert the initialSelectedUser format to the internal format
  const convertedInitialUser = initialSelectedUser ? {
    id: initialSelectedUser.userId,
    name: initialSelectedUser.userName,
    avatar: initialSelectedUser.userAvatar,
    conversationId: initialSelectedUser.conversationId
  } : null;
  
  // If directMessageUser is provided, use it to create the initial user
  const initialUserFromProps = directMessageUser ? {
    id: directMessageUser.userId,
    name: directMessageUser.userName,
    avatar: directMessageUser.userAvatar,
    conversationId: directMessageUser.conversationId
  } : convertedInitialUser;
  
  const [selectedUser, setSelectedUser] = useState<SelectedUser>(initialUserFromProps);
  const { hideConversation } = useHiddenDMs();

  // Apply initialSelectedUser or directMessageUser when they change
  useEffect(() => {
    if (directMessageUser) {
      console.log('[DMContainer] Setting directMessageUser:', directMessageUser.userName);
      setSelectedUser({
        id: directMessageUser.userId,
        name: directMessageUser.userName,
        avatar: directMessageUser.userAvatar,
        conversationId: directMessageUser.conversationId
      });
    } else if (initialSelectedUser) {
      console.log('[DMContainer] Setting initial selected user:', initialSelectedUser.userName);
      setSelectedUser({
        id: initialSelectedUser.userId,
        name: initialSelectedUser.userName,
        avatar: initialSelectedUser.userAvatar,
        conversationId: initialSelectedUser.conversationId
      });
    }
  }, [initialSelectedUser, directMessageUser]);

  const handleSelectUser = (userId: string, userName: string, userAvatar?: string, conversationId?: string) => {
    const user = {
      id: userId,
      name: userName,
      avatar: userAvatar,
      conversationId
    };
    setSelectedUser(user);
    if (setDirectMessageUser) {
      setDirectMessageUser({
        userId: userId,
        userName: userName,
        userAvatar: userAvatar,
        conversationId
      });
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
    const handleOpenDM = (event: CustomEvent<{userId: string, userName: string, userAvatar?: string, conversationId?: string}>) => {
      const { userId, userName, userAvatar, conversationId } = event.detail;
      handleSelectUser(userId, userName, userAvatar, conversationId);
    };

    window.addEventListener('openDirectMessage', handleOpenDM as EventListener);
    return () => {
      window.removeEventListener('openDirectMessage', handleOpenDM as EventListener);
    };
  }, []);

  return (
    <div className="flex flex-col h-full w-full">
      {!selectedUser ? (
        // Conversation list view with search panel
        <DMSearchPanel />
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
              conversationId={selectedUser.conversationId}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default DMContainer;
