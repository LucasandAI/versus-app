
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

  // Load unread counts from localStorage on mount and when updated
  useEffect(() => {
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
    
    // Load unread counts initially and on relevant events
    loadUnreadCounts();
    
    const handleChatClosed = () => {
      // Wait for a short timeout to ensure localStorage is updated
      setTimeout(loadUnreadCounts, 100);
    };
    
    const handleSupportTicketCreated = (event: CustomEvent) => {
      if (event.detail && event.detail.count) {
        setChatNotifications(prev => prev + event.detail.count);
      }
    };
    
    window.addEventListener('chatDrawerClosed', handleChatClosed);
    window.addEventListener('unreadMessagesUpdated', loadUnreadCounts);
    window.addEventListener('supportTicketCreated', handleSupportTicketCreated as EventListener);
    window.addEventListener('focus', loadUnreadCounts);
    
    return () => {
      window.removeEventListener('chatDrawerClosed', handleChatClosed);
      window.removeEventListener('unreadMessagesUpdated', loadUnreadCounts);
      window.removeEventListener('supportTicketCreated', handleSupportTicketCreated as EventListener);
      window.removeEventListener('focus', loadUnreadCounts);
    };
  }, []);

  const renderView = () => {
    switch (currentView) {
      case 'connect':
        return <ConnectScreen />;
      case 'home':
        return <HomeView chatNotifications={chatNotifications} />;
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
