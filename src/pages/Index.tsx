import React, { useEffect, useState } from 'react';
import { useApp } from '@/context/AppContext';
import ConnectScreen from '@/components/ConnectScreen';
import HomeView from '@/components/HomeView';
import Leaderboard from '@/components/Leaderboard';
import UserProfile from '@/components/UserProfile';
import Navigation from '@/components/Navigation';
import SupportPopover from '@/components/shared/SupportPopover';
import { Toaster } from '@/components/ui/toaster';
import { useLocation, useNavigate } from 'react-router-dom';
import { slugifyClubName } from '@/utils/slugify';

const Index: React.FC = () => {
  const { currentView, currentUser, selectedClub } = useApp();
  const [chatNotifications, setChatNotifications] = useState(0);
  const location = useLocation();
  const navigate = useNavigate();

  // Update URL when current view changes - only when authenticated
  useEffect(() => {
    const isReady = currentUser?.stravaConnected && 
                   currentView === 'clubDetail' && 
                   selectedClub;
                   
    if (isReady) {
      const slug = selectedClub.slug || slugifyClubName(selectedClub.name);
      if (!location.pathname.includes(`/clubs/${slug}`)) {
        navigate(`/clubs/${slug}`);
      }
    }
  }, [currentView, selectedClub, navigate, location, currentUser?.stravaConnected]);

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

  const renderView = () => {
    switch (currentView) {
      case 'connect':
        return <ConnectScreen />;
      case 'home':
        return <HomeView chatNotifications={chatNotifications} />;
      case 'leaderboard':
        return <Leaderboard />;
      case 'profile':
        return <UserProfile />;
      default:
        return <ConnectScreen />;
    }
  };

  const handleCreateSupportTicket = (ticketId: string, subject: string, message: string) => {
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
    <div className="min-h-screen bg-gray-50">
      {renderView()}
      {currentUser?.stravaConnected && currentView !== 'connect' && <Navigation />}
      {currentUser?.stravaConnected && <SupportPopover onCreateSupportChat={handleCreateSupportTicket} />}
      <Toaster />
    </div>
  );
};

export default Index;
