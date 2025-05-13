
import { useState, useEffect } from 'react';

export function useActiveClubMessages(
  clubId: string | undefined | null,
  globalMessages: Record<string, any[]> = {}
) {
  const [messages, setMessages] = useState<any[]>([]);
  
  // Update local messages when global messages change or clubId changes
  useEffect(() => {
    if (!clubId) {
      setMessages([]);
      return;
    }
    
    const clubMessages = globalMessages[clubId] || [];
    console.log(`[useActiveClubMessages] Setting messages for club ${clubId}:`, clubMessages.length);
    setMessages(clubMessages);
    
    // Also listen for global events that might indicate new messages
    const handleClubMessageReceived = (event: CustomEvent) => {
      if (event.detail && event.detail.clubId === clubId) {
        const updatedMessages = globalMessages[clubId] || [];
        console.log(`[useActiveClubMessages] Event update for club ${clubId}:`, updatedMessages.length);
        setMessages(updatedMessages);
      }
    };
    
    window.addEventListener('clubMessageReceived', handleClubMessageReceived as EventListener);
    return () => {
      window.removeEventListener('clubMessageReceived', handleClubMessageReceived as EventListener);
    };
  }, [clubId, globalMessages]);
  
  return { messages };
}
