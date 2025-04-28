
import React, { useEffect } from 'react';
import DMSearchPanel from './DMSearchPanel';

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
  return (
    <div className="h-full overflow-hidden">
      <DMSearchPanel />
    </div>
  );
};

export default DMContainer;
