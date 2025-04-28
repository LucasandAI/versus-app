
import React, { useEffect, useState, useRef } from 'react';
import DMSearchPanel from './DMSearchPanel';
import DMConversationList from './DMConversationList';
import { useHiddenDMs } from '@/hooks/chat/useHiddenDMs';
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
  const { currentUser } = useApp();
  const { hiddenDMs } = useHiddenDMs();
  const [isLoading, setIsLoading] = useState(true);
  const [basicConversations, setBasicConversations] = useState<any[]>([]);
  const [fetchAttempted, setFetchAttempted] = useState(false);
  const fetchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current);
      }
    };
  }, []);

  // Fetch conversations only when component mounts AND user is available
  useEffect(() => {
    // Guard clause: early return if user is not available
    if (!currentUser?.id) {
      if (!fetchAttempted) {
        console.log('DMContainer: currentUser.id not available, deferring fetch');
      }
      return;
    }

    // Clear any existing timeout
    if (fetchTimeoutRef.current) {
      clearTimeout(fetchTimeoutRef.current);
    }

    // Set a small delay before fetching to ensure auth is fully ready
    fetchTimeoutRef.current = setTimeout(async () => {
      try {
        setIsLoading(true);
        setFetchAttempted(true);
        console.log('DMContainer: Fetching basic conversations for user after delay:', currentUser.id);
        
        // Get all direct conversations without waiting for user details or messages
        const { data: conversationsData, error } = await supabase
          .from('direct_conversations')
          .select('id, user1_id, user2_id, created_at')
          .or(`user1_id.eq.${currentUser.id},user2_id.eq.${currentUser.id}`);
        
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
            
            // Check if this conversation should be hidden
            if (hiddenDMs.includes(otherUserId)) {
              return null;
            }
            
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
          
          setBasicConversations(initialConversations);
        } else {
          console.log('DMContainer: No conversations found');
        }
      } catch (error) {
        console.error("Error fetching basic conversations:", error);
      } finally {
        setIsLoading(false);
      }
    }, 100); // 100ms delay
  }, [currentUser?.id, hiddenDMs]);

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
