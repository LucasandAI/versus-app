
import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import HomeHeader from '@/components/home/HomeHeader';
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
    open(); // Just call open directly instead of trying to call isOpen
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
        {/* We need to restore functionality without HomeCurrentUser and HomeContent */}
        <div className="py-8">
          <h2 className="text-2xl font-semibold mb-4">Welcome to Versus</h2>
          <p className="text-gray-600 mb-8">Your club-based running app where teams compete weekly based on total distance run.</p>
        </div>
      </div>
      
      {/* Chat drawer */}
      <ChatDrawer
        open={isOpen}
        onOpenChange={(isOpen) => isOpen ? open() : close()}
        clubs={userClubs}
      />
    </div>
  );
};

export default Index;
