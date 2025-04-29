
import React, { useEffect, useState, useRef } from 'react';
import DMSearchPanel from './DMSearchPanel';
import DMConversationList from './DMConversationList';
import { useApp } from '@/context/AppContext';
import { useDirectConversations } from '@/hooks/chat/dm/useDirectConversations';

interface DMContainerProps {
  directMessageUser: {
    userId: string;
    userName: string;
    userAvatar: string;
    conversationId: string;
  } | null;
  setDirectMessageUser: React.Dispatch<React.SetStateAction<{
    userId: string;
    userName: string;
    userAvatar: string;
    conversationId: string;
  } | null>>;
}

const DMContainer: React.FC<DMContainerProps> = ({ directMessageUser, setDirectMessageUser }) => {
  const { currentUser, isSessionReady } = useApp();
  const [isLoading, setIsLoading] = useState(false);
  const isMounted = useRef(true);
  
  // Get direct conversations hook but don't automatically fetch
  const { conversations, loading, fetchConversations, resetFetchState } = useDirectConversations([]);
  
  // Clean up resources on unmount
  useEffect(() => {
    isMounted.current = true;
    
    return () => {
      isMounted.current = false;
      // Reset fetch state when component unmounts
      resetFetchState();
    };
  }, [resetFetchState]);

  const handleSelectUser = (userId: string, userName: string, userAvatar: string, conversationId: string) => {
    setDirectMessageUser({
      userId,
      userName,
      userAvatar,
      conversationId
    });
  };

  return (
    <div className="h-full overflow-hidden flex flex-col">
      <DMSearchPanel />
      <div className="flex-1 overflow-hidden">
        <DMConversationList 
          onSelectUser={handleSelectUser} 
          selectedUserId={directMessageUser?.userId}
          onRefresh={fetchConversations}
          isLoading={isLoading || loading}
        />
      </div>
    </div>
  );
};

export default DMContainer;
