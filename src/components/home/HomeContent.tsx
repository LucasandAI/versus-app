
import React from 'react';
import { useApp } from '@/context/AppContext';
import HomeClubsSection from './HomeClubsSection';

interface HomeContentProps {
  onChatWithUser: (userId: string, name: string) => void;
}

const HomeContent: React.FC<HomeContentProps> = ({ onChatWithUser }) => {
  const { currentUser, setCurrentView, setSelectedClub, setSelectedUser } = useApp();

  const userClubs = currentUser?.clubs || [];

  // Stub for available clubs - would typically be fetched from an API
  const availableClubs = [];

  const handleSelectClub = (club) => {
    setSelectedClub(club);
    setCurrentView('clubDetail');
  };

  const handleSelectUser = (userId: string, name: string, avatar?: string) => {
    setSelectedUser({
      id: userId,
      name,
      avatar: avatar || '/placeholder.svg',
      clubs: []
    });
    setCurrentView('profile');
    
    // Also allow chat with user if needed
    onChatWithUser(userId, name);
  };

  return (
    <div className="space-y-8">
      <HomeClubsSection 
        userClubs={userClubs}
        availableClubs={availableClubs}
        onSelectClub={handleSelectClub}
        onSelectUser={handleSelectUser}
        onCreateClub={() => {}}
        onRequestJoin={() => {}}
        onSearchClick={() => {}}
      />
    </div>
  );
};

export default HomeContent;
