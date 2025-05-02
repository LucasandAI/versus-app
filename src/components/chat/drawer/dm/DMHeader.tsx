
import React, { useEffect, useState, useRef, memo } from 'react';
import UserAvatar from '@/components/shared/UserAvatar';
import { useUserData } from '@/hooks/chat/dm/useUserData';

interface DMHeaderProps {
  userId: string;
  userName: string;
  userAvatar?: string;
}

const DMHeader: React.FC<DMHeaderProps> = memo(({ userId, userName, userAvatar }) => {
  const { userCache, fetchUserData } = useUserData();
  const [displayName, setDisplayName] = useState(userName);
  const [displayAvatar, setDisplayAvatar] = useState(userAvatar);
  const initialDataAppliedRef = useRef(false);
  
  // First mount - set from props
  useEffect(() => {
    if (!initialDataAppliedRef.current) {
      setDisplayName(userName || 'User');
      setDisplayAvatar(userAvatar);
      initialDataAppliedRef.current = true;
    }
  }, [userName, userAvatar]);
  
  // Then try to get from cache or fetch
  useEffect(() => {
    const fetchAndUpdateUserData = async () => {
      try {
        // Check cache first
        const cachedUser = userCache[userId];
        if (cachedUser?.name) {
          console.log(`[DMHeader] Using cached user data for ${userId}:`, cachedUser);
          setDisplayName(cachedUser.name);
          if (cachedUser.avatar) setDisplayAvatar(cachedUser.avatar);
          return;
        }
        
        // Fetch only if not in cache
        console.log(`[DMHeader] Fetching user data for ${userId}`);
        const userData = await fetchUserData(userId);
        
        if (userData) {
          console.log(`[DMHeader] Fetched user data for ${userId}:`, userData);
          setDisplayName(userData.name || displayName);
          if (userData.avatar) setDisplayAvatar(userData.avatar);
        }
      } catch (error) {
        console.error(`[DMHeader] Error fetching user data for ${userId}:`, error);
      }
    };
    
    if (userId) {
      fetchAndUpdateUserData();
    }
  }, [userId, userCache, fetchUserData]);

  return (
    <>
      <UserAvatar 
        name={displayName || 'User'} 
        image={displayAvatar} 
        size="sm" 
      />
      <h3 className="font-semibold">{displayName || 'User'}</h3>
    </>
  );
});

DMHeader.displayName = 'DMHeader';

export default DMHeader;
