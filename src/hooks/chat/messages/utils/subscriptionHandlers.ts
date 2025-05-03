
import { Club } from '@/types';

export const handleNewMessagePayload = (
  payload: any, 
  userClubs: Club[], 
  setClubMessages: React.Dispatch<React.SetStateAction<Record<string, any[]>>>,
  currentUser: any,
  selectedClubId: string | null
) => {
  if (!payload.new || !payload.new.club_id) {
    console.error('[handleNewMessagePayload] Invalid payload:', payload);
    return;
  }
  
  // Check if the message is for a club the user belongs to
  const clubId = payload.new.club_id;
  const userClubIds = userClubs.map(club => club.id);
  
  if (!userClubIds.includes(clubId)) {
    console.log(`[handleNewMessagePayload] Message for club ${clubId} not relevant to user's clubs`);
    return;
  }
  
  console.log(`[handleNewMessagePayload] New message for club ${clubId}`);

  // Update local messages state
  setClubMessages(prev => {
    const clubMessages = prev[clubId] || [];
    
    // Check if message already exists in the array
    const messageExists = clubMessages.some(msg => 
      String(msg.id) === String(payload.new.id)
    );
    
    if (messageExists) {
      return prev;
    }
    
    // Add the new message
    return {
      ...prev,
      [clubId]: [...clubMessages, payload.new]
    };
  });

  // If the message is not from the current user, dispatch events for unread indicators
  if (payload.new.sender_id !== currentUser?.id) {
    console.log(`[handleNewMessagePayload] Message from another user, sending unread event`);
    
    // Dispatch an unread message event if the club is not currently selected
    if (selectedClubId !== clubId) {
      // Use a custom event to trigger unread count updates
      const event = new CustomEvent('clubMessageUnread', { 
        detail: { clubId } 
      });
      window.dispatchEvent(event);
    }
    
    // Always dispatch the general message received event
    window.dispatchEvent(new CustomEvent('clubMessageReceived', { 
      detail: { clubId, message: payload.new } 
    }));
  }
};

export const handleMessageDeletion = (
  payload: any,
  setClubMessages: React.Dispatch<React.SetStateAction<Record<string, any[]>>>
) => {
  if (payload.old && payload.old.id && payload.old.club_id) {
    const deletedMessageId = payload.old.id;
    const clubId = payload.old.club_id;
    
    setClubMessages(prev => {
      if (!prev[clubId]) return prev;
      
      const updatedClubMessages = prev[clubId].filter(msg => {
        const msgId = typeof msg.id === 'string' ? msg.id : 
                    (msg.id ? String(msg.id) : null);
        const deleteId = typeof deletedMessageId === 'string' ? deletedMessageId : 
                        String(deletedMessageId);
        
        return msgId !== deleteId;
      });
      
      return {
        ...prev,
        [clubId]: updatedClubMessages
      };
    });
  }
};
