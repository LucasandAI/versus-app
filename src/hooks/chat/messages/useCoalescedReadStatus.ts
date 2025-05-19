
import { useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useApp } from '@/context/AppContext';
import { toast } from '@/hooks/use-toast';

// A utility function to debounce function calls
const debounce = <F extends (...args: any[]) => any>(
  func: F, 
  wait: number
): ((...args: Parameters<F>) => void) => {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  
  return (...args: Parameters<F>) => {
    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(() => {
      timeout = null;
      func(...args);
    }, wait);
  };
};

export const useCoalescedReadStatus = () => {
  const { currentUser } = useApp();
  const pendingMarkAsRead = useRef<{
    conversations: Set<string>,
    clubs: Set<string>
  }>({
    conversations: new Set<string>(),
    clubs: new Set<string>()
  });
  
  // Track active conversation/club to avoid redundant marking
  const activeConversation = useRef<{type: 'dm'|'club'|null, id: string|null}>({
    type: null, 
    id: null
  });
  
  // Update the active conversation tracking
  useEffect(() => {
    const handleActiveConversationChanged = (event: CustomEvent) => {
      console.log('[useCoalescedReadStatus] Active conversation changed:', event.detail);
      activeConversation.current = {
        type: event.detail.type,
        id: event.detail.id
      };
      
      // If we have an active conversation, mark it as read immediately
      if (event.detail.type === 'dm' && event.detail.id) {
        markConversationAsRead(event.detail.id);
      } else if (event.detail.type === 'club' && event.detail.id) {
        markClubAsRead(event.detail.id);
      }
    };
    
    window.addEventListener('activeConversationChanged', handleActiveConversationChanged as EventListener);
    
    // Listen for visibility change to refresh read status when tab becomes active
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('[useCoalescedReadStatus] Tab became visible, checking active conversation');
        if (activeConversation.current.type === 'dm' && activeConversation.current.id) {
          markConversationAsRead(activeConversation.current.id);
        } else if (activeConversation.current.type === 'club' && activeConversation.current.id) {
          markClubAsRead(activeConversation.current.id);
        }
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      window.removeEventListener('activeConversationChanged', handleActiveConversationChanged as EventListener);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);
  
  // Process pending conversation marks with debouncing
  const processConversationMarks = useCallback(debounce(async () => {
    if (!currentUser?.id) return;
    
    const conversationsToMark = Array.from(pendingMarkAsRead.current.conversations);
    if (conversationsToMark.length === 0) return;
    
    console.log(`[useCoalescedReadStatus] Processing ${conversationsToMark.length} conversation read marks`);
    
    try {
      // Process in batches if needed
      const batchSize = 10;
      for (let i = 0; i < conversationsToMark.length; i += batchSize) {
        const batch = conversationsToMark.slice(i, i + batchSize);
        
        // Create upsert items for each conversation
        const upsertItems = batch.map(conversationId => ({
          conversation_id: conversationId,
          user_id: currentUser.id,
          last_read_timestamp: new Date().toISOString()
        }));
        
        const { error } = await supabase
          .from('direct_messages_read')
          .upsert(upsertItems);
          
        if (error) {
          throw error;
        }
        
        // Clear processed items from the pending set
        batch.forEach(id => pendingMarkAsRead.current.conversations.delete(id));
      }
      
      // Notify that messages have been marked as read
      window.dispatchEvent(new CustomEvent('messagesMarkedAsRead', {
        detail: { type: 'dm', batched: true }
      }));
    } catch (error) {
      console.error('[useCoalescedReadStatus] Error marking conversations as read:', error);
      toast({
        title: "Error updating message status",
        description: "Please check your connection and try again.",
        variant: "destructive"
      });
    }
  }, 300), [currentUser?.id]);
  
  // Process pending club marks with debouncing
  const processClubMarks = useCallback(debounce(async () => {
    if (!currentUser?.id) return;
    
    const clubsToMark = Array.from(pendingMarkAsRead.current.clubs);
    if (clubsToMark.length === 0) return;
    
    console.log(`[useCoalescedReadStatus] Processing ${clubsToMark.length} club read marks`);
    
    try {
      // Process in batches if needed
      const batchSize = 10;
      for (let i = 0; i < clubsToMark.length; i += batchSize) {
        const batch = clubsToMark.slice(i, i + batchSize);
        
        // Create upsert items for each club
        const upsertItems = batch.map(clubId => ({
          club_id: clubId,
          user_id: currentUser.id,
          last_read_timestamp: new Date().toISOString()
        }));
        
        const { error } = await supabase
          .from('club_messages_read')
          .upsert(upsertItems);
          
        if (error) {
          throw error;
        }
        
        // Clear processed items from the pending set
        batch.forEach(id => pendingMarkAsRead.current.clubs.delete(id));
      }
      
      // Notify that messages have been marked as read
      window.dispatchEvent(new CustomEvent('messagesMarkedAsRead', {
        detail: { type: 'club', batched: true }
      }));
    } catch (error) {
      console.error('[useCoalescedReadStatus] Error marking clubs as read:', error);
      toast({
        title: "Error updating message status",
        description: "Please check your connection and try again.",
        variant: "destructive"
      });
    }
  }, 300), [currentUser?.id]);
  
  // Mark a conversation as read
  const markConversationAsRead = useCallback(async (conversationId: string) => {
    if (!currentUser?.id || !conversationId) return;
    
    // Add to pending set
    pendingMarkAsRead.current.conversations.add(conversationId);
    
    // Optimistically update the UI immediately via an event
    window.dispatchEvent(new CustomEvent('messagesMarkedAsRead', {
      detail: { type: 'dm', id: conversationId }
    }));
    
    // Process the actual database update (debounced)
    processConversationMarks();
  }, [currentUser?.id, processConversationMarks]);
  
  // Mark a club as read
  const markClubAsRead = useCallback(async (clubId: string) => {
    if (!currentUser?.id || !clubId) return;
    
    // Add to pending set
    pendingMarkAsRead.current.clubs.add(clubId);
    
    // Optimistically update the UI immediately via an event
    window.dispatchEvent(new CustomEvent('messagesMarkedAsRead', {
      detail: { type: 'club', id: clubId }
    }));
    
    // Process the actual database update (debounced)
    processClubMarks();
  }, [currentUser?.id, processClubMarks]);
  
  return {
    markConversationAsRead,
    markClubAsRead
  };
};
