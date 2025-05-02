
import React, { useEffect, useState } from 'react';
import UserAvatar from '@/components/shared/UserAvatar';
import { useUserData } from '@/hooks/chat/dm/useUserData';

interface DMHeaderProps {
  userId: string;
  userName: string;
  userAvatar?: string;
}

const DMHeader: React.FC<DMHeaderProps> = ({ userId, userName, userAvatar }) => {
  const { userCache, fetchUserData } = useUserData();
  const [displayName, setDisplayName] = useState(userName);
  const [displayAvatar, setDisplayAvatar] = useState(userAvatar);
  
  useEffect(() => {
    // Update from props
    setDisplayName(userName);
    setDisplayAvatar(userAvatar);
    
    // Try to get from cache if available
    const cachedUser = userCache[userId];
    if (cachedUser) {
      if (cachedUser.name) setDisplayName(cachedUser.name);
      if (cachedUser.avatar) setDisplayAvatar(cachedUser.avatar);
    } else {
      // Fetch if not in cache
      fetchUserData(userId).then(userData => {
        if (userData) {
          setDisplayName(userData.name);
          setDisplayAvatar(userData.avatar);
        }
      });
    }
  }, [userId, userName, userAvatar, userCache, fetchUserData]);

  return (
    <>
      <UserAvatar 
        name={displayName} 
        image={displayAvatar} 
        size="sm" 
      />
      <h3 className="font-semibold">{displayName}</h3>
    </>
  );
};

export default DMHeader;
