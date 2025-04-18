
import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { Club } from '@/types';
import ChatDrawer from '@/components/chat/ChatDrawer';
import SupportPopover from '@/components/shared/SupportPopover';
import CreateClubDialog from '@/components/club/CreateClubDialog';
import SearchClubDialog from '@/components/club/SearchClubDialog';
import HomeHeader from '@/components/home/HomeHeader';
import ClubList from '@/components/home/ClubList';
import FindClubsSection from '@/components/home/FindClubsSection';
import HomeNotifications from '@/components/home/HomeNotifications';
import { useClubActions } from '@/hooks/home/useClubActions';
import { useSupportActions } from '@/hooks/home/useSupportActions';
import { toast } from '@/hooks/use-toast';
import { refreshNotifications } from '@/lib/notificationUtils';

interface HomeViewProps {
  chatNotifications?: number;
}

const HomeView: React.FC<HomeViewProps> = ({ chatNotifications = 0 }) => {
  const { setCurrentView, setSelectedClub, setSelectedUser, currentUser } = useApp();
  const [unreadMessages, setUnreadMessages] = useState(chatNotifications);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [chatDrawerOpen, setChatDrawerOpen] = useState(false);

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

  const handleSelectClub = (club: Club) => {
    setSelectedClub(club);
    setCurrentView('clubDetail');
  };

  const handleSelectUser = (userId: string, name: string) => {
    setSelectedUser({
      id: userId,
      name: name,
      avatar: '/placeholder.svg',
      stravaConnected: true,
      clubs: []
    });
    setCurrentView('profile');
  };

  const handleOpenChat = () => {
    setChatDrawerOpen(true);
  };

  const handleMarkNotificationAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === id ? { ...notification, read: true } : notification
      )
    );
    
    const storedNotifications = localStorage.getItem('notifications');
    if (storedNotifications) {
      try {
        const parsedNotifications = JSON.parse(storedNotifications);
        const updatedNotifications = parsedNotifications.map((notification: any) => 
          notification.id === id ? { ...notification, read: true } : notification
        );
        localStorage.setItem('notifications', JSON.stringify(updatedNotifications));
        
        const event = new CustomEvent('notificationsUpdated');
        window.dispatchEvent(event);
      } catch (error) {
        console.error("Error updating notification:", error);
      }
    }
  };

  const handleDeclineInvite = (id: string) => {
    const notification = notifications.find(n => n.id === id);
    const clubName = notification?.clubName || "the club";
    
    setNotifications(prev => prev.filter(notification => notification.id !== id));
    
    const storedNotifications = localStorage.getItem('notifications');
    if (storedNotifications) {
      try {
        const parsedNotifications = JSON.parse(storedNotifications);
        const updatedNotifications = parsedNotifications.filter(
          (n: any) => n.id !== id
        );
        localStorage.setItem('notifications', JSON.stringify(updatedNotifications));
        
        const event = new CustomEvent('notificationsUpdated');
        window.dispatchEvent(event);
        
        toast({
          title: "Invitation Declined",
          description: `You have declined the invitation to join ${clubName}`
        });
      } catch (error) {
        console.error("Error declining invitation:", error);
      }
    }
  };

  const handleClearAllNotifications = () => {
    setNotifications([]);
    
    localStorage.setItem('notifications', JSON.stringify([]));
    
    const event = new CustomEvent('notificationsUpdated');
    window.dispatchEvent(event);
    
    toast({
      title: "Notifications Cleared",
      description: "All notifications have been cleared"
    });
  };

  const userClubs = currentUser?.clubs || [];
  const isAtClubCapacity = userClubs.length >= 3;

  const handleJoinClubFromNotification = (clubId: string, clubName: string) => {
    handleJoinClub(clubId, clubName);
    
    setTimeout(() => {
      const notificationsFromStorage = localStorage.getItem('notifications');
      if (notificationsFromStorage) {
        try {
          setNotifications(JSON.parse(notificationsFromStorage));
        } catch (error) {
          console.error("Error parsing notifications:", error);
        }
      }
    }, 100);
  };

  useEffect(() => {
    // Force refresh notifications on initial load to ensure we have our test invites
    refreshNotifications();
    
    const handleNotificationsUpdated = () => {
      const storedNotifications = localStorage.getItem('notifications');
      if (storedNotifications) {
        try {
          setNotifications(JSON.parse(storedNotifications));
        } catch (error) {
          console.error("Error parsing notifications:", error);
        }
      }
    };
    
    window.addEventListener('notificationsUpdated', handleNotificationsUpdated);
    
    // Initial load of notifications
    handleNotificationsUpdated();
    
    return () => {
      window.removeEventListener('notificationsUpdated', handleNotificationsUpdated);
    };
  }, []);

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
          onJoinClub={handleJoinClubFromNotification}
          onDeclineInvite={handleDeclineInvite}
          onOpenChat={handleOpenChat}
        />

        <ClubList 
          userClubs={userClubs}
          onSelectClub={handleSelectClub}
          onSelectUser={handleSelectUser}
          onCreateClub={() => setCreateClubDialogOpen(true)}
        />

        {!isAtClubCapacity && (
          <FindClubsSection 
            clubs={availableClubs}
            onRequestJoin={handleRequestToJoin}
            onSearchClick={() => setSearchDialogOpen(true)}
            onCreateClick={() => setCreateClubDialogOpen(true)}
          />
        )}

        {isAtClubCapacity && (
          <div className="mt-10 bg-white rounded-lg shadow-md p-6 text-center">
            <h3 className="font-medium mb-2">Club Limit Reached</h3>
            <p className="text-gray-500 text-sm mb-4">
              You have reached the maximum of 3 clubs.
            </p>
          </div>
        )}
      </div>

      <ChatDrawer 
        open={chatDrawerOpen} 
        onOpenChange={(open) => {
          setChatDrawerOpen(open);
          if (!open) {
            const event = new CustomEvent('chatDrawerClosed');
            window.dispatchEvent(event);
          }
        }} 
        clubs={userClubs}
        onNewMessage={(count) => setUnreadMessages(count)} 
        supportTickets={supportTickets}
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
