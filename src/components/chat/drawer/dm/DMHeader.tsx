
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
    const fetchAndUpdateUserData = async () => {
      // Update from props first
      setDisplayName(userName);
      setDisplayAvatar(userAvatar);
      
      try {
        // Try to get from cache if available
        const cachedUser = userCache[userId];
        if (cachedUser?.name) {
          console.log(`[DMHeader] Using cached user data for ${userId}:`, cachedUser);
          setDisplayName(cachedUser.name);
          if (cachedUser.avatar) setDisplayAvatar(cachedUser.avatar);
          return;
        }
        
        // Fetch if not in cache or incomplete
        console.log(`[DMHeader] Fetching user data for ${userId}`);
        const userData = await fetchUserData(userId);
        console.log(`[DMHeader] Fetched user data for ${userId}:`, userData);
        
        if (userData) {
          setDisplayName(userData.name);
          if (userData.avatar) setDisplayAvatar(userData.avatar);
        }
      } catch (error) {
        console.error(`[DMHeader] Error fetching user data for ${userId}:`, error);
      }
    };
    
    fetchAndUpdateUserData();
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
