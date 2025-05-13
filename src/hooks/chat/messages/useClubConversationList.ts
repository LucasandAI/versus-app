
import { useState, useEffect } from 'react';
import { Club } from '@/types';
import { useClubLastMessages } from './useClubLastMessages';
import { ClubConversation } from './useClubConversations';

// Make this interface match ClubConversation from useClubConversations.ts
export const useClubConversationList = (clubs: Club[]): ClubConversation[] => {
  const [clubConversationList, setClubConversationList] = useState<ClubConversation[]>([]);
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
    
    // Sort conversation list by timestamp (newest first) to ensure that
    // new messages appear at the top
    const sortedConversations = [...conversationList].sort((a, b) => {
      const timeA = a.lastMessage?.timestamp ? new Date(a.lastMessage.timestamp).getTime() : 0;
      const timeB = b.lastMessage?.timestamp ? new Date(b.lastMessage.timestamp).getTime() : 0;
      return timeB - timeA; // Descending order (newest first)
    });
    
    setClubConversationList(sortedConversations);
  }, [clubs, lastMessages, senderCache]);
  
  return clubConversationList;
};
