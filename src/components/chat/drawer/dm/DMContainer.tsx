
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
  const fetchInitiatedRef = useRef(false);
  
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

  // Fetch conversations when component mounts - but only once and only if we have a user and session
  useEffect(() => {
    // Don't fetch if we already initiated a fetch, or if we don't have user/session
    if (fetchInitiatedRef.current || !currentUser?.id || !isSessionReady) {
      return;
    }
    
    // Mark that we've initiated a fetch to prevent duplicates
    fetchInitiatedRef.current = true;
    
    // Set local loading state during initial fetch
    setIsLoading(true);
    
    // Only fetch if we have both session and user
    console.log('[DMContainer] Component mounted, fetching conversations');
    fetchConversations()
      .finally(() => {
        if (isMounted.current) {
          setIsLoading(false);
        }
      });
    
  }, [currentUser?.id, isSessionReady, fetchConversations]);

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
