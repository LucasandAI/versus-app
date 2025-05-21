
import React, { useCallback } from 'react';
import { Club } from '@/types';
import { useClubMessages } from '@/hooks/chat/useClubMessages';

interface ClubMessagesContextValue {
  clubMessages: Record<string, any[]>;
  setClubMessages: React.Dispatch<React.SetStateAction<Record<string, any[]>>>;
  refreshClubMessages: (clubId: string) => void;
}

const ClubMessagesContext = React.createContext<ClubMessagesContextValue | undefined>(undefined);

export const ClubMessagesProvider: React.FC<{ clubs: Club[], isOpen: boolean, children: React.ReactNode }> = ({ clubs, isOpen, children }) => {
  const { clubMessages, setClubMessages } = useClubMessages(clubs, isOpen);
  
  // Add a refresh function to manually trigger a re-fetch for a specific club
  const refreshClubMessages = useCallback((clubId: string) => {
    console.log(`[ClubMessagesContext] Manually refreshing messages for club: ${clubId}`);
    // This could be extended to fetch fresh messages if needed
    // For now we'll rely on real-time updates
  }, []);
  
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
