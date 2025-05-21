
import React, { useCallback } from 'react';
import { Club } from '@/types';
import { useClubMessages } from '@/hooks/chat/useClubMessages';
import { useUnreadMessages } from '@/context/unread-messages';

interface ClubMessagesContextValue {
  clubMessages: Record<string, any[]>;
  setClubMessages: React.Dispatch<React.SetStateAction<Record<string, any[]>>>;
  refreshClubMessages: (clubId: string) => void;
}

const ClubMessagesContext = React.createContext<ClubMessagesContextValue | undefined>(undefined);

export const ClubMessagesProvider: React.FC<{ clubs: Club[], isOpen: boolean, children: React.ReactNode }> = ({ clubs, isOpen, children }) => {
  const { clubMessages, setClubMessages } = useClubMessages(clubs, isOpen);
  const { refreshUnreadCounts } = useUnreadMessages();
  
  // Add a refresh function to manually trigger a re-fetch for a specific club
  const refreshClubMessages = useCallback((clubId: string) => {
    console.log(`[ClubMessagesContext] Manually refreshing messages for club: ${clubId}`);
    
    // Trigger badge refresh via global event
    window.dispatchEvent(new CustomEvent('refreshUnreadCounts'));
    
    // Also call the unread counts refresh from the context
    refreshUnreadCounts();
  }, [refreshUnreadCounts]);
  
  return (
    <ClubMessagesContext.Provider value={{ clubMessages, setClubMessages, refreshClubMessages }}>
      {children}
    </ClubMessagesContext.Provider>
  );
};

export function useClubMessagesContext() {
  const ctx = React.useContext(ClubMessagesContext);
  if (!ctx) throw new Error('useClubMessagesContext must be used within a ClubMessagesProvider');
  return ctx;
}
