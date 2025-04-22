
import React from 'react';
import { AppProvider, useApp } from '@/context/AppContext';
import ConnectScreen from '@/components/ConnectScreen';
import HomeView from '@/components/home/HomeView';
import ClubDetail from '@/components/ClubDetail';
import Leaderboard from '@/components/Leaderboard';
import UserProfile from '@/components/UserProfile';
import Navigation from '@/components/Navigation';
import SupportPopover from '@/components/shared/SupportPopover';
import { Toaster } from '@/components/ui/toaster';

const AppContent: React.FC = () => {
  const { currentView, currentUser } = useApp();
  const [chatNotifications, setChatNotifications] = React.useState(0);

  // Load unread counts from localStorage on mount and when updated
  React.useEffect(() => {
    const loadUnreadCounts = () => {
      const unreadMessages = localStorage.getItem('unreadMessages');
      if (unreadMessages) {
        try {
          const unreadMap = JSON.parse(unreadMessages);
          // Calculate total unread count
          const totalUnread = Object.values(unreadMap).reduce(
            (sum: number, count: unknown) => sum + (typeof count === 'number' ? count : 0), 
            0
          );
          setChatNotifications(Number(totalUnread));
        } catch (error) {
          console.error("Error parsing unread messages:", error);
          setChatNotifications(0);
        }
      } else {
        setChatNotifications(0);
      }
    };
    
    // Load unread counts initially
    loadUnreadCounts();
    
    // Set up event listeners for tracking unread message counts
    const handleUnreadMessagesUpdated = () => {
      loadUnreadCounts();
    };
    
    const handleSupportTicketCreated = (event: CustomEvent) => {
      if (event.detail && event.detail.count) {
        setChatNotifications(prev => prev + event.detail.count);
      } else {
        // If no count is provided, reload from localStorage
        loadUnreadCounts();
      }
    };
    
    // Listen for events that should update the notification count
    window.addEventListener('unreadMessagesUpdated', handleUnreadMessagesUpdated);
    window.addEventListener('supportTicketCreated', handleSupportTicketCreated as EventListener);
    window.addEventListener('chatDrawerClosed', handleUnreadMessagesUpdated);
    window.addEventListener('focus', handleUnreadMessagesUpdated);
    window.addEventListener('notificationsUpdated', handleUnreadMessagesUpdated);
    
    // Make sure to check for notification changes frequently for better UX
    const checkInterval = setInterval(handleUnreadMessagesUpdated, 1000);
    
    return () => {
      window.removeEventListener('unreadMessagesUpdated', handleUnreadMessagesUpdated);
      window.removeEventListener('supportTicketCreated', handleSupportTicketCreated as EventListener);
      window.removeEventListener('chatDrawerClosed', handleUnreadMessagesUpdated);
      window.removeEventListener('focus', handleUnreadMessagesUpdated);
      window.removeEventListener('notificationsUpdated', handleUnreadMessagesUpdated);
      clearInterval(checkInterval);
    };
  }, []);

  console.log('[Index] AppContent rendering with currentView:', currentView);

  const renderView = () => {
    switch (currentView) {
      case 'connect':
        console.log('[Index] Rendering ConnectScreen');
        return <ConnectScreen />;
      case 'home':
        console.log('[Index] Rendering HomeView');
        return <HomeView chatNotifications={chatNotifications} />;
      case 'clubDetail':
        console.log('[Index] Rendering ClubDetail');
        return <ClubDetail />;
      case 'leaderboard':
        console.log('[Index] Rendering Leaderboard');
        return <Leaderboard />;
      case 'profile':
        console.log('[Index] Rendering UserProfile');
        return <UserProfile />;
      default:
        console.log('[Index] No matching view, defaulting to ConnectScreen');
        return <ConnectScreen />;
    }
  };

  const handleCreateSupportChat = (ticketId: string, subject: string, message: string) => {
    // Update local state immediately 
    setChatNotifications(prev => prev + 1);
    
    // Force a reload of unread counts from localStorage
    const unreadMessages = localStorage.getItem('unreadMessages');
    if (unreadMessages) {
      try {
        const unreadMap = JSON.parse(unreadMessages);
        // Calculate total unread count
        const totalUnread = Object.values(unreadMap).reduce(
          (sum: number, count: unknown) => sum + (typeof count === 'number' ? count : 0), 
          0
        );
        setChatNotifications(Number(totalUnread));
      } catch (error) {
        console.error("Error parsing unread messages:", error);
      }
    }
    
    // Dispatch event to notify other components
    const event = new CustomEvent('unreadMessagesUpdated');
    window.dispatchEvent(event);
  };

  return (
    <>
      {renderView()}
      {currentUser && currentView !== 'connect' && <Navigation />}
      {currentUser && <SupportPopover onCreateSupportChat={handleCreateSupportChat} />}
      <Toaster />
    </>
  );
};

const Index: React.FC = () => {
  console.log('[Index] Index component rendering');
  return (
    <AppProvider>
      <div className="min-h-screen bg-gray-50">
        <AppContent />
      </div>
    </AppProvider>
  );
};

export default Index;
