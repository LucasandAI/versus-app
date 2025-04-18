
import React, { createContext, useContext, useState } from 'react';
import { Club } from '@/types';
import { SupportTicket } from '@/types/chat';

interface ChatContextType {
  selectedClub: Club | null;
  selectedTicket: SupportTicket | null;
  setSelectedClub: (club: Club | null) => void;
  setSelectedTicket: (ticket: SupportTicket | null) => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [selectedClub, setSelectedClub] = useState<Club | null>(null);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);

  return (
    <ChatContext.Provider value={{
      selectedClub,
      selectedTicket,
      setSelectedClub,
      setSelectedTicket,
    }}>
      {children}
    </ChatContext.Provider>
  );
}

export const useChat = () => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};
