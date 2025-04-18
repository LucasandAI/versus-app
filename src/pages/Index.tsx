
import React, { useEffect, useState } from 'react';
import { AppProvider, useApp } from '@/context/AppContext';
import ConnectScreen from '@/components/ConnectScreen';
import HomeView from '@/components/HomeView';
import ClubDetail from '@/components/ClubDetail';
import Leaderboard from '@/components/Leaderboard';
import UserProfile from '@/components/UserProfile';
import Navigation from '@/components/Navigation';
import SupportPopover from '@/components/shared/SupportPopover';
import { Toaster } from '@/components/ui/toaster';

const AppContent: React.FC = () => {
  const { currentView, currentUser } = useApp();
  const [chatNotifications, setChatNotifications] = useState(0);

  // Listen for support ticket created events and load existing unread counts
  useEffect(() => {
    const handleSupportTicketCreated = (event: CustomEvent) => {
      if (event.detail && event.detail.count) {
        setChatNotifications(prev => prev + event.detail.count);
      }
    };

    window.addEventListener('supportTicketCreated', handleSupportTicketCreated as EventListener);
    
    // Load initial unread counts from localStorage
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
          // Explicitly set as a number
          setChatNotifications(Number(totalUnread));
        } catch (error) {
          console.error("Error parsing unread messages:", error);
          setChatNotifications(0); // Reset to 0 on error
        }
      } else {
        setChatNotifications(0); // Reset to 0 if no unread messages
      }
    };
    
    // Load unread counts immediately and on window focus
    loadUnreadCounts();
    window.addEventListener('focus', loadUnreadCounts);
    
    // Also listen for chat drawer closed event to refresh the count
    const handleChatClosed = () => {
      loadUnreadCounts();
    };
    
    window.addEventListener('chatDrawerClosed', handleChatClosed);
    
    return () => {
      window.removeEventListener('supportTicketCreated', handleSupportTicketCreated as EventListener);
      window.removeEventListener('focus', loadUnreadCounts);
      window.removeEventListener('chatDrawerClosed', handleChatClosed);
    };
  }, []);

  const renderView = () => {
    switch (currentView) {
      case 'connect':
        return <ConnectScreen />;
      case 'home':
        return <HomeView />;
      case 'clubDetail':
        return <ClubDetail />;
      case 'leaderboard':
        return <Leaderboard />;
      case 'profile':
        return <UserProfile />;
      default:
        return <ConnectScreen />;
    }
  };

  const handleCreateSupportChat = (ticketId: string, subject: string, message: string) => {
    setChatNotifications(prev => prev + 1);
  };

  return (
    <>
      {renderView()}
      {currentUser?.stravaConnected && currentView !== 'connect' && <Navigation />}
      {currentUser?.stravaConnected && <SupportPopover onCreateSupportChat={handleCreateSupportChat} />}
      <Toaster />
    </>
  );
};

const Index: React.FC = () => {
  return (
    <AppProvider>
      <div className="min-h-screen bg-gray-50">
        <AppContent />
      </div>
    </AppProvider>
  );
};

export default Index;
