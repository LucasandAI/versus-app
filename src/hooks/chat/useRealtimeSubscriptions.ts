
import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ChatMessage } from '@/types/chat';

interface SubscriptionOptions {
  onNewMessage?: (message: ChatMessage) => void;
  onMessageDeleted?: (messageId: string) => void;
  onError?: (error: any) => void;
  enabled?: boolean;
}

export const useRealtimeSubscriptions = (
  conversationId: string,
  conversationType: 'club' | 'dm',
  options: SubscriptionOptions = {}
) => {
  const {
    onNewMessage,
    onMessageDeleted,
    onError,
    enabled = true
  } = options;
  
  const channelsRef = useRef<any[]>([]);
  const activeSubscriptionRef = useRef<boolean>(false);

  // Clean up function for subscriptions
  const cleanupSubscriptions = useCallback(() => {
    if (channelsRef.current.length > 0) {
      console.log(`[useRealtimeSubscriptions] Cleaning up ${channelsRef.current.length} channels`);
      
      channelsRef.current.forEach(channel => {
        if (channel) {
          supabase.removeChannel(channel);
        }
      });
      
      channelsRef.current = [];
      activeSubscriptionRef.current = false;
    }
  }, []);

  // Set up real-time subscriptions
  useEffect(() => {
    // Skip if not enabled or no conversation ID
    if (!enabled || !conversationId || conversationId === 'new') {
      cleanupSubscriptions();
      return;
    }
    
    // Skip if already subscribed to this conversation
    if (activeSubscriptionRef.current) {
      return;
    }
    
    console.log(`[useRealtimeSubscriptions] Setting up subscription for ${conversationType} ${conversationId}`);
    
    // Clean up any existing channels
    cleanupSubscriptions();
    
    try {
      // Choose table and filter based on conversation type
      const table = conversationType === 'club' ? 'club_chat_messages' : 'direct_messages';
      const idField = conversationType === 'club' ? 'club_id' : 'conversation_id';
      
      // Subscribe to new messages
      const insertChannel = supabase.channel(`${table}-inserts-${conversationId}`);
      insertChannel
        .on('postgres_changes',
          { 
            event: 'INSERT', 
            schema: 'public', 
            table,
            filter: `${idField}=eq.${conversationId}`
          },
          async (payload) => {
            try {
              console.log(`[useRealtimeSubscriptions] New ${conversationType} message:`, payload.new);
              
              if (!payload.new) return;
              
              // For club messages, the text field is called "message"
              const text = payload.new.text || payload.new.message;
              
              if (conversationType === 'club' && !payload.new.sender) {
                // Fetch sender details for club messages
                const { data: senderData } = await supabase
                  .from('users')
                  .select('id, name, avatar')
                  .eq('id', payload.new.sender_id)
                  .single();
                  
                if (senderData && onNewMessage) {
                  onNewMessage({
                    id: payload.new.id,
                    text,
                    sender: senderData,
                    timestamp: payload.new.timestamp
                  });
                }
              } else if (conversationType === 'dm' && onNewMessage) {
                // For DM messages, handle differently
                const { data: senderData } = await supabase
                  .from('users')
                  .select('id, name, avatar')
                  .eq('id', payload.new.sender_id)
                  .single();
                  
                if (senderData) {
                  onNewMessage({
                    id: payload.new.id,
                    text,
                    sender: senderData,
                    timestamp: payload.new.timestamp
                  });
                }
              }
            } catch (error) {
              console.error(`[useRealtimeSubscriptions] Error processing message:`, error);
              if (onError) onError(error);
            }
          })
        .subscribe();
        
      // Subscribe to message deletions
      const deleteChannel = supabase.channel(`${table}-deletes-${conversationId}`);
      deleteChannel
        .on('postgres_changes',
          { 
            event: 'DELETE', 
            schema: 'public', 
            table,
            filter: `${idField}=eq.${conversationId}`
          },
          (payload) => {
            console.log(`[useRealtimeSubscriptions] Deleted ${conversationType} message:`, payload.old);
            
            if (payload.old && payload.old.id && onMessageDeleted) {
              onMessageDeleted(payload.old.id);
            }
          })
        .subscribe();
        
      // Store channels for cleanup
      channelsRef.current = [insertChannel, deleteChannel];
      activeSubscriptionRef.current = true;
    } catch (error) {
      console.error(`[useRealtimeSubscriptions] Error setting up subscription:`, error);
      if (onError) onError(error);
    }
    
    return cleanupSubscriptions;
  }, [conversationId, conversationType, enabled, cleanupSubscriptions, onNewMessage, onMessageDeleted, onError]);

  return {
    isSubscribed: activeSubscriptionRef.current,
    cleanup: cleanupSubscriptions
  };
};
