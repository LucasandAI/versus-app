
import React, { useEffect } from 'react';
import DMSearchPanel from './DMSearchPanel';
import DMConversationList from './DMConversationList';
import DMConversation from './DMConversation';
import { useHiddenDMs } from '@/hooks/chat/useHiddenDMs';
import { useConversations } from '@/hooks/chat/dm/useConversations';

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
  const { hiddenDMs } = useHiddenDMs();
  const { conversations, loading, fetchConversations } = useConversations(hiddenDMs);
  
  // Immediately fetch conversations when component mounts and when tab changes
  useEffect(() => {
    // Trigger an immediate fetch of conversations when the DM tab is opened
    fetchConversations();
  }, [fetchConversations]);

  const handleSelectUser = (userId: string, userName: string, userAvatar: string, conversationId: string) => {
    setDirectMessageUser({
      userId,
      userName,
      userAvatar,
      conversationId
    });
  };

  return (
    <div className="h-full flex">
      <div className="w-[280px] border-r bg-white h-full flex flex-col overflow-hidden">
        <DMConversationList 
          onSelectUser={handleSelectUser}
          selectedUserId={directMessageUser?.userId}
          loading={loading}
        />
        <DMSearchPanel />
      </div>
      
      <div className="flex-1">
        {directMessageUser ? (
          <DMConversation
            userId={directMessageUser.userId}
            userName={directMessageUser.userName}
            userAvatar={directMessageUser.userAvatar}
            conversationId={directMessageUser.conversationId}
          />
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center text-gray-500 p-8">
            <h3 className="text-xl font-medium mb-2">No conversation selected</h3>
            <p>Select a conversation from the list or search for someone to start a new conversation</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DMContainer;
