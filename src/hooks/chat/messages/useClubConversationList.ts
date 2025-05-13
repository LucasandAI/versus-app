
import { useState, useEffect } from 'react';
import { Club } from '@/types';
import { useClubLastMessages } from './useClubLastMessages';

interface ClubConversationListItem {
  club: Club;
  lastMessage?: {
    message: string;
    sender_id?: string;
    sender?: {
      id: string;
      name: string;
      avatar?: string;
    };
    sender_username?: string;
    timestamp: string;
  } | null;
}

export const useClubConversationList = (clubs: Club[]): ClubConversationListItem[] => {
  const [clubConversationList, setClubConversationList] = useState<ClubConversationListItem[]>([]);
  const { lastMessages, isLoading, senderCache } = useClubLastMessages(clubs);
  
  useEffect(() => {
    // Map clubs to their conversations with last messages
    const conversationList = clubs.map(club => {
      const lastMessage = lastMessages[club.id];
      
      return {
        club,
        lastMessage: lastMessage ? {
          message: lastMessage.message,
          sender_id: lastMessage.sender_id,
          sender: lastMessage.sender,
          sender_username: lastMessage.sender?.name || 
                          (senderCache[lastMessage.sender_id]?.name || 'Unknown'),
          timestamp: lastMessage.timestamp
        } : null
      };
    });
    
    setClubConversationList(conversationList);
  }, [clubs, lastMessages, senderCache]);
  
  return clubConversationList;
};
