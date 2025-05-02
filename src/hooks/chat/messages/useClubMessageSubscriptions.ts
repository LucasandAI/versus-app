
import { useEffect, useRef, useCallback } from 'react';
import { Club } from '@/types';
import { RealtimeChannel } from '@supabase/supabase-js';
import { createClubChannel, cleanupChannels } from './utils/subscriptionUtils';
import { processNewMessage } from './utils/messageHandlerUtils';
import { supabase } from '@/integrations/supabase/client';
import { useApp } from '@/context/AppContext';
import { useUnreadMessages } from '@/context/UnreadMessagesContext';

export const useClubMessageSubscriptions = (
  userClubs: Club[],
  isOpen: boolean,
  activeSubscriptionsRef: React.MutableRefObject<Record<string, boolean>>,
  setClubMessages: React.Dispatch<React.SetStateAction<Record<string, any[]>>>
) => {
  const channelsRef = useRef<RealtimeChannel[]>([]);
  const { currentUser, isSessionReady } = useApp();
  const { markClubMessagesAsRead } = useUnreadMessages();
  
  const selectedClubRef = useRef<string | null>(null);
  const messageCountRef = useRef<number>(0); // For debugging
  const updateCountRef = useRef<number>(0); // For tracking state updates
  
  // Debug: Log current state periodically to detect sync issues
  useEffect(() => {
    if (isOpen && userClubs.length > 0) {
      console.log('[useClubMessageSubscriptions] Current state:', {
        selectedClub: selectedClubRef.current,
        openClubs: userClubs.map(c => c.id),
        subscriptionsActive: Object.keys(activeSubscriptionsRef.current || {})
      });
    }
  }, [isOpen, userClubs, activeSubscriptionsRef]);
  
  useEffect(() => {
    // Skip if not authenticated, session not ready, drawer not open, or no clubs
    if (!isSessionReady || !currentUser?.id || !isOpen || !userClubs.length) {
      // Clean up all channels
      if (channelsRef.current.length > 0) {
        console.log('[useClubMessageSubscriptions] Cleaning up channels - not ready or drawer closed');
        cleanupChannels(channelsRef.current);
        channelsRef.current = [];
        activeSubscriptionsRef.current = {};
      }
      return;
    }
    
    console.log('[useClubMessageSubscriptions] Setting up subscriptions for clubs:', userClubs.length);
    
    // Clean up previous channels before creating new ones
    if (channelsRef.current.length > 0) {
      console.log('[useClubMessageSubscriptions] Cleaning up previous channels');
      cleanupChannels(channelsRef.current);
      channelsRef.current = [];
    }
    
    activeSubscriptionsRef.current = {};
    
    // Set up subscription for message deletions
    const deletionChannel = supabase.channel('club-message-deletions');
    deletionChannel
      .on('postgres_changes', 
          { 
            event: 'DELETE', 
            schema: 'public', 
            table: 'club_chat_messages',
            filter: userClubs.length > 0 ? 
              `club_id=in.(${userClubs.map(club => `'${club.id}'`).join(',')})` : 
              undefined
          },
          (payload) => {
            console.log('[useClubMessageSubscriptions] Message deletion event received:', payload);
            
            if (payload.old && payload.old.id && payload.old.club_id) {
              const deletedMessageId = payload.old.id;
              const clubId = payload.old.club_id;
              
              updateCountRef.current += 1;
              const count = updateCountRef.current;
              console.log(`[useClubMessageSubscriptions] (#${count}) Updating messages after deletion`);
              
              setClubMessages(prev => {
                if (!prev[clubId]) return prev;
                
                const updatedClubMessages = prev[clubId].filter(msg => {
                  const msgId = typeof msg.id === 'string' ? msg.id : 
                              (msg.id ? String(msg.id) : null);
                  const deleteId = typeof deletedMessageId === 'string' ? deletedMessageId : 
                                  String(deletedMessageId);
                  
                  return msgId !== deleteId;
                });
                
                // Important: Create a new object to ensure React detects the change
                const updatedMessages = {
                  ...prev,
                  [clubId]: updatedClubMessages
                };
                
                console.log(`[useClubMessageSubscriptions] (#${count}) State after deletion:`, 
                  Object.keys(updatedMessages).map(id => `${id}: ${updatedMessages[id]?.length || 0} messages`));
                
                return updatedMessages;
              });
            }
          })
      .subscribe();
      
    channelsRef.current.push(deletionChannel);
    
    // Create individual channels for each club (for INSERT events)
    userClubs.forEach(club => {
      const clubId = club.id;
      activeSubscriptionsRef.current[clubId] = true;
      
      // Create unique channel for this club
      const channel = createClubChannel(club);
      
      // Subscribe to the channel
      channel.subscribe((status) => {
        console.log(`[useClubMessageSubscriptions] Channel status for club ${clubId}:`, status);
      });

      // Add specific message handler for this club
      channel.on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'club_chat_messages',
        filter: `club_id=eq.${clubId}`
      }, (payload) => {
        messageCountRef.current += 1;
        const count = messageCountRef.current;
        updateCountRef.current += 1;
        const updateCount = updateCountRef.current;
        
        console.log(`[useClubMessageSubscriptions] (#${count}) New message for club ${clubId}:`, payload.new?.id);
        console.log(`[useClubMessageSubscriptions] (#${count}) Currently selected club:`, selectedClubRef.current);
        
        // When a new message is received, fetch the sender details
        const fetchSenderDetails = async () => {
          if (!payload.new?.sender_id) return payload.new;
          
          try {
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
            
            return payload.new;
          } catch (error) {
            console.error('[useClubMessageSubscriptions] Error fetching sender details:', error);
            return payload.new;
          }
        };
        
        // Process the message with sender details
        fetchSenderDetails().then(messageWithSender => {
          console.log(`[useClubMessageSubscriptions] (#${count}) Setting club messages with new message for club ${clubId}`);
          console.log(`[useClubMessageSubscriptions] (#${count}) Message sender:`, messageWithSender.sender_id);
          console.log(`[useClubMessageSubscriptions] (#${count}) Current user:`, currentUser.id);
          
          // IMPORTANT FIX: Create a new state update with a fresh reference that guarantees React re-renders
          setClubMessages(prev => {
            const clubMsgs = prev[clubId] || [];
            
            // Check if message already exists to prevent duplicates
            const messageExists = clubMsgs.some(msg => msg.id === messageWithSender.id);
            
            if (messageExists) {
              console.log(`[useClubMessageSubscriptions] (#${count}) Message already exists, skipping`);
              return prev;
            }
            
            console.log(`[useClubMessageSubscriptions] (#${count}) Adding message to club ${clubId}`);
            console.log(`[useClubMessageSubscriptions] (#${count}) Previous message count:`, clubMsgs.length);
            console.log(`[useClubMessageSubscriptions] (#${count}) Update #${updateCount} triggered`);
            
            // Create a new array to ensure React detects the change
            const newMessages = [...clubMsgs, messageWithSender].sort(
              (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
            );
            
            console.log(`[useClubMessageSubscriptions] (#${count}) New message count:`, newMessages.length);
            
            // Create a completely new object reference to ensure React detects the change
            return {
              ...prev,
              [clubId]: newMessages
            };
          });
        });
        
        // If the message is from another user and NOT the currently viewed club,
        // we need to update the unread count for this club
        if (payload.new.sender_id !== currentUser.id && 
            (!selectedClubRef.current || selectedClubRef.current !== clubId)) {
          window.dispatchEvent(new CustomEvent('clubMessageReceived', { 
            detail: { clubId } 
          }));
        }
      });

      channelsRef.current.push(channel);
    });
    
    return () => {
      console.log('[useClubMessageSubscriptions] Cleaning up channels due to effect cleanup');
      cleanupChannels(channelsRef.current);
      channelsRef.current = [];
      activeSubscriptionsRef.current = {};
    };
  }, [userClubs, isOpen, setClubMessages, currentUser?.id, isSessionReady, markClubMessagesAsRead]);

  // Enhanced club selection tracking with additional debugging
  useEffect(() => {
    const handleClubSelected = (e: CustomEvent) => {
      const clubId = e.detail?.clubId;
      if (clubId) {
        console.log(`[useClubMessageSubscriptions] Club selected: ${clubId}`);
        selectedClubRef.current = clubId;
        
        // Mark club messages as read when selected
        if (currentUser?.id) {
          markClubMessagesAsRead(clubId);
        }
        
        // DEBUGGING: Force a state update to check if this resolves the issue
        setClubMessages(prev => ({...prev}));
      }
    };

    const handleClubDeselected = () => {
      console.log('[useClubMessageSubscriptions] Club deselected');
      selectedClubRef.current = null;
    };

    window.addEventListener('clubSelected', handleClubSelected as EventListener);
    window.addEventListener('clubDeselected', handleClubDeselected);

    return () => {
      window.removeEventListener('clubSelected', handleClubSelected as EventListener);
      window.removeEventListener('clubDeselected', handleClubDeselected);
    };
  }, [currentUser?.id, markClubMessagesAsRead, setClubMessages]);
};
