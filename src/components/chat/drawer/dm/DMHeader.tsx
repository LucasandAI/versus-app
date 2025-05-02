
import React, { memo } from 'react';
import UserAvatar from '@/components/shared/UserAvatar';

interface DMHeaderProps {
  userId: string;
  userName: string;
  userAvatar?: string;
}

// Memoized component to prevent unnecessary re-renders
const DMHeader: React.FC<DMHeaderProps> = memo(({ userId, userName, userAvatar }) => {
  // Use the provided values directly, no state or fetching needed
  return (
    <>
      <UserAvatar 
        name={userName || 'User'} 
        image={userAvatar} 
        size="sm" 
      />
      <h3 className="font-semibold">{userName || 'User'}</h3>
    </>
  );
});

DMHeader.displayName = 'DMHeader';

export default DMHeader;
