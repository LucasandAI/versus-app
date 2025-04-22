
import React, { useEffect, useState } from 'react';
import { AppProvider, useApp } from '@/context/AppContext';
import ConnectScreen from '@/components/ConnectScreen';
import HomeView from '@/components/home/HomeView';
import ClubDetail from '@/components/ClubDetail';
import Leaderboard from '@/components/Leaderboard';
import UserProfile from '@/components/UserProfile';
import Navigation from '@/components/Navigation';
import SupportPopover from '@/components/shared/SupportPopover';
import { Toaster } from '@/components/ui/toaster';
import { supabase } from '@/integrations/supabase/client';
import { ensureDivision } from '@/utils/club/leagueUtils';

const AppContent: React.FC = () => {
  const { currentView, currentUser, setCurrentUser } = useApp();
  const [chatNotifications, setChatNotifications] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Check for authentication and load user data on mount
  useEffect(() => {
    const checkAuth = async () => {
      setIsLoading(true);
      
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        setIsLoading(false);
        return;
      }
      
      try {
        // User is authenticated, fetch their data
        const { data: userData, error } = await supabase
          .from('users')
          .select('id, name, avatar, bio')
          .eq('id', session.user.id)
          .single();
          
        if (error || !userData) {
          console.error('Error fetching user:', error);
          setIsLoading(false);
          return;
        }
        
        // Load user's clubs
        const { data: memberships, error: clubsError } = await supabase
          .from('club_members')
          .select('club:clubs(id, name, logo, division, tier, elite_points)')
          .eq('user_id', userData.id);
          
        if (clubsError) {
          console.error('Error fetching user clubs:', clubsError);
        }
        
        const clubs = memberships && memberships.length > 0 
          ? memberships.map(m => {
              if (!m.club) return null;
              return {
                id: m.club.id,
                name: m.club.name, 
                logo: m.club.logo || '/placeholder.svg',
                division: ensureDivision(m.club.division),
                tier: m.club.tier || 1,
                elitePoints: m.club.elite_points || 0,
                members: [],
                matchHistory: []
              };
            }).filter(Boolean)
          : [];
        
        setCurrentUser({
          id: userData.id,
          name: userData.name,
          avatar: userData.avatar || '/placeholder.svg',
          bio: userData.bio,
          clubs: clubs
        });
        
      } catch (error) {
        console.error('Error loading user data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    checkAuth();
  }, []);
  
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

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

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
  return (
    <AppProvider>
      <div className="min-h-screen bg-gray-50">
        <AppContent />
      </div>
    </AppProvider>
  );
};

export default Index;
