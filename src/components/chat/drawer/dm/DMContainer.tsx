
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

  // Fetch basic conversations only when session is ready AND user is available
  useEffect(() => {
    // Guard clause: early return if user is not available OR session is not ready
    if (!currentUser?.id || !isSessionReady) {
      if (!fetchAttempted) {
        console.log('DMContainer: currentUser.id not available or session not ready, deferring fetch');
      }
      return;
    }

    // Skip if we've already fetched
    if (hasFetchedRef.current) {
      return;
    }
    
    hasFetchedRef.current = true;

    // Clear any existing timeout
    if (fetchTimeoutRef.current) {
      clearTimeout(fetchTimeoutRef.current);
    }

    // Set a delay before fetching to ensure auth is fully ready
    fetchTimeoutRef.current = setTimeout(async () => {
      if (!isMounted.current) return;
      
      try {
        setIsLoading(true);
        setFetchAttempted(true);
        console.log('DMContainer: Fetching basic conversations for user after delay:', currentUser.id);
        
        // Get all direct conversations without waiting for user details or messages
        const { data: conversationsData, error } = await supabase
          .from('direct_conversations')
          .select('id, user1_id, user2_id, created_at')
          .or(`user1_id.eq.${currentUser.id},user2_id.eq.${currentUser.id}`);
        
        if (!isMounted.current) return;
        
        if (error) {
          console.error("Error fetching basic conversations:", error);
          setIsLoading(false);
          return;
        }
        
        if (conversationsData && conversationsData.length > 0) {
          console.log('DMContainer: Found', conversationsData.length, 'conversations');
          // Create basic conversation objects with minimal information
          const initialConversations = conversationsData.map(conv => {
            const otherUserId = conv.user1_id === currentUser.id ? conv.user2_id : conv.user1_id;
            
            return {
              conversationId: conv.id,
              userId: otherUserId,
              userName: "Loading...", // Placeholder name
              userAvatar: "/placeholder.svg", // Placeholder avatar
              lastMessage: "",
              timestamp: conv.created_at,
              isLoading: true
            };
          }).filter(Boolean);
          
          if (isMounted.current) {
            setBasicConversations(initialConversations);
          }
        } else {
          console.log('DMContainer: No conversations found');
        }
      } catch (error) {
        console.error("Error fetching basic conversations:", error);
      } finally {
        if (isMounted.current) {
          setIsLoading(false);
        }
      }
    }, 300); // Increased delay for better reliability
  }, [currentUser?.id, isSessionReady, fetchAttempted]);

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
