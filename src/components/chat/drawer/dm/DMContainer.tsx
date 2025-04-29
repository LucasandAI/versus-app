
import React from 'react';
import DMSearchPanel from './DMSearchPanel';
import DMConversationList from './DMConversationList';

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
        />
      </div>
    </div>
  );
};

export default DMContainer;
