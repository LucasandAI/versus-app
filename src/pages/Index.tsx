
import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import HomeHeader from '@/components/home/HomeHeader';
import HomeCurrentUser from '@/components/home/HomeCurrentUser';
import HomeContent from '@/components/home/HomeContent';
import { useChatDrawerGlobal } from '@/context/ChatDrawerContext';
import ChatDrawer from '@/components/chat/ChatDrawer';

const Index = () => {
  const { currentUser } = useApp();
  const { isOpen, open, close } = useChatDrawerGlobal();
  const [notifications, setNotifications] = useState([]);
  
  const userClubs = currentUser?.clubs || [];

  const handleUserSelect = (userId: string, name: string) => {
    const event = new CustomEvent('openDirectMessage', { 
      detail: { userId, userName: name } 
    });
    window.dispatchEvent(event);
    open();
  };
  
  const handleMarkAsRead = (id: string) => {
    // Implementation for marking notification as read
    console.log("Marking notification as read:", id);
  };
  
  const handleClearAll = () => {
    // Implementation for clearing all notifications
    setNotifications([]);
  };
  
  const handleDeclineInvite = (id: string) => {
    // Implementation for declining an invite
    console.log("Declining invite:", id);
  };

  return (
    <div className="min-h-screen">
      <HomeHeader 
        notifications={notifications}
        onMarkAsRead={handleMarkAsRead}
        onClearAll={handleClearAll}
        onUserClick={handleUserSelect}
        onDeclineInvite={handleDeclineInvite}
      />
      <div className="container max-w-6xl mx-auto px-4">
        <HomeCurrentUser />
        <HomeContent onChatWithUser={handleUserSelect} />
      </div>
      
      {/* Chat drawer */}
      <ChatDrawer
        open={isOpen}
        onOpenChange={(open) => open ? open() : close()}
        clubs={userClubs}
      />
    </div>
  );
};

export default Index;
