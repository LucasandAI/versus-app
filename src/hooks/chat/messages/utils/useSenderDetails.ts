
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useSenderDetails = () => {
  const [senderCache, setSenderCache] = useState<Record<string, any>>({});
  
  const fetchSenderDetails = useCallback(async (senderId: string) => {
    if (!senderId) return null;
    
    // Check cache first
    if (senderCache[senderId]) {
      return senderCache[senderId];
    }
    
    try {
      const { data: senderData, error } = await supabase
        .from('users')
        .select('id, name, avatar')
        .eq('id', senderId)
        .single();
        
      if (error) {
        console.error('[useSenderDetails] Error fetching sender details:', error);
        return null;
      }
      
      if (senderData) {
        // Update cache
        setSenderCache(prev => ({
          ...prev,
          [senderId]: senderData
        }));
        
        return senderData;
      }
      
      return null;
    } catch (error) {
      console.error('[useSenderDetails] Error fetching sender details:', error);
      return null;
    }
  }, [senderCache]);
  
  const getSenderWithDetails = useCallback(async (message: any) => {
    if (!message?.sender_id) return message;
    
    try {
      const senderDetails = await fetchSenderDetails(message.sender_id);
      
      if (senderDetails) {
        return {
          ...message,
          sender: senderDetails
        };
      }
      
      return message;
    } catch (error) {
      console.error('[useSenderDetails] Error getting sender details for message:', error);
      return message;
    }
  }, [fetchSenderDetails]);
  
  return { fetchSenderDetails, getSenderWithDetails };
};
