import { supabase } from '@/integrations/supabase/client';

export const processNewMessage = async (payload: any, clubId: string, currentUserId: string | null) => {
  console.log(`[processNewMessage] Processing message for club ${clubId}`);
  
  if (!payload.new) {
    return null;
  }
  
  try {
    // If the message already includes sender information, use it as is
    if (payload.new.sender) {
      return payload.new;
    }
    
    // Otherwise fetch sender details
    if (payload.new.sender_id) {
      const { data: senderData } = await supabase
        .from('users')
        .select('id, name, avatar')
        .eq('id', payload.new.sender_id)
        .single();
        
      if (senderData) {
        return {
          ...payload.new,
          sender: senderData
        };
      }
    }
    
    // If we couldn't fetch sender details, return the original message
    return payload.new;
  } catch (error) {
    console.error('[processNewMessage] Error processing message:', error);
    return payload.new; // Return original message as fallback
  }
};

// Export a function to dispatch force update events
export const dispatchForceUpdate = (clubId: string, messageId: string) => {
  console.log(`[dispatchForceUpdate] Forcing update for club ${clubId}, message ${messageId}`);
  
  // Create a custom event with clubId in the detail
  const event = new CustomEvent('clubMessageForceUpdate', {
    detail: { clubId, messageId }
  });
  
  // Dispatch the event
  window.dispatchEvent(event);
};
