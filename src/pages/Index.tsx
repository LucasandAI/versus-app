
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

  // Listen for support ticket created events
  useEffect(() => {
    const handleSupportTicketCreated = (event: CustomEvent) => {
      if (event.detail && event.detail.count) {
        setChatNotifications(prev => prev + event.detail.count);
      }
    };

    window.addEventListener('supportTicketCreated', handleSupportTicketCreated as EventListener);
    
    // Also load initial unread counts from localStorage
    const loadUnreadCounts = () => {
      const unreadMessages = localStorage.getItem('unreadMessages');
      if (unreadMessages) {
        try {
          const unreadMap = JSON.parse(unreadMessages);
          const totalUnread = Object.values(unreadMap).reduce((sum, count) => sum + (count as number), 0);
          setChatNotifications(totalUnread);
        } catch (error) {
          console.error("Error parsing unread messages:", error);
        }
      }
    };
    
    loadUnreadCounts();
    
    // Listen for route changes or app focus to refresh unread counts
    window.addEventListener('focus', loadUnreadCounts);
    
    return () => {
      window.removeEventListener('supportTicketCreated', handleSupportTicketCreated as EventListener);
      window.removeEventListener('focus', loadUnreadCounts);
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
