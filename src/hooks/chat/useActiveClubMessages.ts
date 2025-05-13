
import { useState, useEffect } from 'react';
import { ChatMessage } from '@/types/chat';

/**
 * Hook for managing active club messages with real-time synchronization
 * 
 * @param clubId The ID of the club to get messages for
 * @param globalMessages The global messages state from the parent component
 * @returns Object containing the current messages for the club
 */
export const useActiveClubMessages = (
  clubId: string | undefined,
  globalMessages: Record<string, any[]> = {}
) => {
  const [messages, setMessages] = useState<any[]>([]);

  // Update local state when club changes or global messages change
  useEffect(() => {
    if (!clubId) {
      setMessages([]);
      return;
    }

    const clubMessages = globalMessages[clubId] || [];
    console.log(`[useActiveClubMessages] Updating messages for club ${clubId}, found ${clubMessages.length} messages`);
    setMessages(clubMessages);
  }, [clubId, globalMessages]);

  return { messages };
};
