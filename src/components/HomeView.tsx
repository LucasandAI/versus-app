
import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { Club } from '@/types';
import { SupportTicket } from '@/types/chat';
import SupportPopover from './shared/SupportPopover';
import CreateClubDialog from './club/CreateClubDialog';
import SearchClubDialog from './club/SearchClubDialog';
import HomeHeader from './home/HomeHeader';
import HomeClubsSection from './home/HomeClubsSection';
import HomeNotifications from './home/HomeNotifications';
import ChatDrawerHandler from './home/ChatDrawerHandler';
import { useClubActions } from '@/hooks/home/useClubActions';
import { useSupportActions } from '@/hooks/home/useSupportActions';
import { useHomeNotifications } from '@/hooks/home/useHomeNotifications';
import { useChatDrawer } from '@/hooks/home/useChatDrawer';

interface HomeViewProps {
  chatNotifications?: number;
}

const HomeView: React.FC<HomeViewProps> = ({ chatNotifications = 0 }) => {
  const { setCurrentView, setSelectedClub, setSelectedUser, currentUser } = useApp();
  const [unreadMessages, setUnreadMessages] = useState(chatNotifications);
  const [notifications, setNotifications] = useState<any[]>([]);
  const { chatDrawerOpen, setChatDrawerOpen } = useChatDrawer();

  const {
    searchDialogOpen,
    setSearchDialogOpen,
    createClubDialogOpen,
    setCreateClubDialogOpen,
    handleRequestToJoin,
    handleJoinClub,
    availableClubs
  } = useClubActions();

  const { supportTickets, handleCreateSupportTicket } = useSupportActions();
  const { setUnreadMessages: updateUnreadMessages } = useHomeNotifications();

  useEffect(() => {
    const handleUserDataUpdate = () => {
      console.log('User data updated, refreshing HomeView');
      
      setNotifications(prev => [...prev]);
    };
    
    window.addEventListener('userDataUpdated', handleUserDataUpdate);
    
    return () => {
      window.removeEventListener('userDataUpdated', handleUserDataUpdate);
    };
  }, []);

  const handleSelectClub = (club: Club) => {
    setSelectedClub(club);
    setCurrentView('clubDetail');
  };

  const handleSelectUser = (userId: string, name: string, avatar?: string) => {
    setSelectedUser({
      id: userId,
      name: name,
      avatar: avatar || '/placeholder.svg',
      clubs: []
    });
    setCurrentView('profile');
  };

  const handleMarkNotificationAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === id ? { ...notification, read: true } : notification
      )
    );
    
    const updatedNotifications = notifications.map(notification => 
      notification.id === id ? { ...notification, read: true } : notification
    );
    localStorage.setItem('notifications', JSON.stringify(updatedNotifications));
    
    const event = new CustomEvent('notificationsUpdated');
    window.dispatchEvent(event);
  };

  const handleDeclineInvite = (id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
    
    const updatedNotifications = notifications.filter(notification => notification.id !== id);
    localStorage.setItem('notifications', JSON.stringify(updatedNotifications));
    
    const event = new CustomEvent('notificationsUpdated');
    window.dispatchEvent(event);
  };

  const handleClearAllNotifications = () => {
    setNotifications([]);
    localStorage.setItem('notifications', JSON.stringify([]));
    
    const event = new CustomEvent('notificationsUpdated');
    window.dispatchEvent(event);
  };

  const userClubs = currentUser?.clubs || [];
  const isAtClubCapacity = userClubs.length >= 3;

  return (
    <div className="pb-20 pt-6">
      <div className="container-mobile">
        <HomeNotifications 
          setChatNotifications={setUnreadMessages}
          setNotifications={setNotifications}
        />
        
        <HomeHeader 
          notifications={notifications}
          unreadMessages={unreadMessages}
          onMarkAsRead={handleMarkNotificationAsRead}
          onClearAll={handleClearAllNotifications}
          onUserClick={handleSelectUser}
          onJoinClub={handleJoinClub}
          onDeclineInvite={handleDeclineInvite}
        />

        <HomeClubsSection 
          userClubs={userClubs}
          availableClubs={availableClubs}
          onSelectClub={handleSelectClub}
          onSelectUser={handleSelectUser}
          onCreateClub={() => setCreateClubDialogOpen(true)}
          onRequestJoin={handleRequestToJoin}
          onSearchClick={() => setSearchDialogOpen(true)}
        />
      </div>

      <ChatDrawerHandler 
        userClubs={userClubs}
        onSelectUser={handleSelectUser}
        supportTickets={supportTickets}
        setUnreadMessages={updateUnreadMessages}
      />

      <SearchClubDialog
        open={searchDialogOpen}
        onOpenChange={setSearchDialogOpen}
        clubs={availableClubs}
        onRequestJoin={handleRequestToJoin}
      />

      <CreateClubDialog
        open={createClubDialogOpen}
        onOpenChange={setCreateClubDialogOpen}
      />
      
      <SupportPopover onCreateSupportChat={handleCreateSupportTicket} />
    </div>
  );
};

export default HomeView;
