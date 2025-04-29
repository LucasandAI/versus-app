
import React, { useEffect, useState, useRef } from 'react';
import DMSearchPanel from './DMSearchPanel';
import DMConversationList from './DMConversationList';
import { useApp } from '@/context/AppContext';
import { supabase } from '@/integrations/supabase/client';

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
  const [isLoading, setIsLoading] = useState(true);
  const [basicConversations, setBasicConversations] = useState<any[]>([]);
  const [fetchAttempted, setFetchAttempted] = useState(false);
  const fetchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isMounted = useRef(true);
  const hasFetchedRef = useRef(false);
  
  // Clean up resources on unmount
  useEffect(() => {
    isMounted.current = true;
    
    return () => {
      isMounted.current = false;
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current);
      }
    };
  }, []);

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
          initialConversations={basicConversations}
          isInitialLoading={isLoading}
        />
      </div>
    </div>
  );
};

export default DMContainer;
