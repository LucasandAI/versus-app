
import React, { useEffect, useState } from 'react';
import { Club } from '@/types';
import MainChatDrawer from './drawer/MainChatDrawer';
import { useClubMessages } from '@/hooks/chat/useClubMessages';

interface ChatDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clubs: Club[];
  onNewMessage?: (count: number) => void;
}

const ChatDrawer: React.FC<ChatDrawerProps> = ({ 
  open, 
  onOpenChange, 
  clubs, 
  onNewMessage
}) => {
  const [isReady, setIsReady] = useState(false);
  const { clubMessages, setClubMessages } = useClubMessages(clubs, open);

  // Ensure the drawer is only rendered once the clubs are available and processed
  useEffect(() => {
    if (clubs?.length > 0) {
      console.log('[ChatDrawer] Clubs available, drawer ready:');
      clubs.forEach(club => {
        console.log(`  Club: ${club.name}, ID: ${club.id} (type: ${typeof club.id})`);
      });
      setIsReady(true);
    }
  }, [clubs]);

  if (!isReady) {
    return null; // Don't render until clubs are ready
  }

  return (
    <MainChatDrawer 
      open={open} 
      onOpenChange={onOpenChange} 
      clubs={clubs} 
      onNewMessage={onNewMessage}
      clubMessages={clubMessages}
      setClubMessages={setClubMessages}
    />
  );
};

export default ChatDrawer;
