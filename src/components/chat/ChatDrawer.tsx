
import React, { useEffect, useState } from 'react';
import { Club } from '@/types';
import MainChatDrawer from './drawer/MainChatDrawer';

interface ChatDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clubs: Club[];
  onNewMessage?: (count: number) => void;
}

const ChatDrawer: React.FC<ChatDrawerProps> = (props) => {
  const [refreshKey, setRefreshKey] = useState(Date.now());
  
  // Debug: Check clubs IDs when they're passed to the drawer
  useEffect(() => {
    if (props.clubs?.length > 0) {
      console.log('[ChatDrawer] Clubs passed to drawer:');
      props.clubs.forEach(club => {
        console.log(`  Club: ${club.name}, ID: ${club.id} (type: ${typeof club.id})`);
      });
    }
  }, [props.clubs]);

  // Listen for new club messages to force refresh
  useEffect(() => {
    const handleClubMessage = () => {
      setRefreshKey(Date.now());
    };
    
    window.addEventListener('clubMessageInserted', handleClubMessage as EventListener);
    
    return () => {
      window.removeEventListener('clubMessageInserted', handleClubMessage as EventListener);
    };
  }, []);

  return <MainChatDrawer key={`chat-drawer-${refreshKey}`} {...props} />;
};

export default ChatDrawer;
