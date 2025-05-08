
import React from 'react';
import { useApp } from '@/context/AppContext';
import HomeHeader from '@/components/home/HomeHeader';
import HomeCurrentUser from '@/components/home/HomeCurrentUser';
import HomeContent from '@/components/home/HomeContent';
import { useChatDrawerGlobal } from '@/context/ChatDrawerContext';
import ChatDrawer from '@/components/chat/ChatDrawer';

const Index = () => {
  const { currentUser, userClubs } = useApp();
  const { isOpen, setOpen } = useChatDrawerGlobal();

  const handleUserSelect = (userId: string, name: string) => {
    const event = new CustomEvent('openDirectMessage', { 
      detail: { userId, userName: name } 
    });
    window.dispatchEvent(event);
    setOpen(true);
  };

  return (
    <div className="min-h-screen">
      <HomeHeader />
      <div className="container max-w-6xl mx-auto px-4">
        <HomeCurrentUser />
        <HomeContent onChatWithUser={handleUserSelect} />
      </div>
      
      {/* Chat drawer */}
      <ChatDrawer
        open={isOpen}
        onOpenChange={setOpen}
        clubs={userClubs}
      />
    </div>
  );
};

export default Index;
