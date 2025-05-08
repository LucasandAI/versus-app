
import React from 'react';
import { useApp } from '@/context/AppContext';
import UserAvatar from '../shared/UserAvatar';

const HomeCurrentUser = () => {
  const { currentUser } = useApp();

  if (!currentUser) return null;

  return (
    <div className="flex items-center space-x-4 mb-6">
      <UserAvatar 
        name={currentUser.name || "User"}
        image={currentUser.avatar}
        size="lg"
      />
      <div>
        <h2 className="text-xl font-bold">{currentUser.name || "User"}</h2>
        {currentUser.bio && (
          <p className="text-gray-600 text-sm">{currentUser.bio}</p>
        )}
      </div>
    </div>
  );
};

export default HomeCurrentUser;
