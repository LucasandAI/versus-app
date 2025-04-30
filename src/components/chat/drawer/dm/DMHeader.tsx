
import React from 'react';
import UserAvatar from '@/components/shared/UserAvatar';

interface DMHeaderProps {
  userId: string;
  userName: string;
  userAvatar?: string;
}

const DMHeader: React.FC<DMHeaderProps> = ({ userId, userName, userAvatar }) => {
  return (
    <>
      <UserAvatar name={userName} image={userAvatar} size="sm" />
      <h3 className="font-semibold">{userName}</h3>
    </>
  );
};

export default DMHeader;
