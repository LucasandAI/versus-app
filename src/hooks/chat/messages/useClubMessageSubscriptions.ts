
import { useEffect, useRef, useCallback } from 'react';
import { Club } from '@/types';
import { RealtimeChannel } from '@supabase/supabase-js';
import { createClubChannel, cleanupChannels } from './utils/subscriptionUtils';
import { supabase } from '@/integrations/supabase/client';
import { useApp } from '@/context/AppContext';
import { useUnreadMessages } from '@/context/unread-messages';

export const useClubMessageSubscriptions = (
  userClubs: Club[],
  isOpen: boolean,
  activeSubscriptionsRef: React.MutableRefObject<Record<string, boolean>>,
  setClubMessages: React.Dispatch<React.SetStateAction<Record<string, any[]>>>,
  activeClubId: string | null = null,
  setActiveClubMessages?: React.Dispatch<React.SetStateAction<any[]>>
) => {
  const channelsRef = useRef<RealtimeChannel[]>([]);
  const { currentUser, isSessionReady } = useApp();
  const { markClubMessagesAsRead } = useUnreadMessages();
  const messageUpdateCount = useRef(0);
  
  const selectedClubRef = useRef<string | null>(null);
  
  // Helper function to safely update club messages with a new array reference
  const safeUpdateClubMessages = useCallback((
    clubId: string, 
    messageWithSender: any, 
    updater: (prev: any[]) => any[]
  ) => {
    messageUpdateCount.current += 1;
    const updateId = messageUpdateCount.current;
    
    setClubMessages(prevState => {
      const clubMessages = prevState[clubId] || [];
      const updatedMessages = updater(clubMessages);
      
      // If nothing changed, return the same state to avoid unnecessary re-renders
      if (updatedMessages === clubMessages) {
        return prevState;
      }
      
      console.log(`[useClubMessageSubscriptions] Updating club ${clubId} messages (update #${updateId})`, {
        previousCount: clubMessages.length,
        newCount: updatedMessages.length,
        isActiveClub: clubId === activeClubId,
        selectedClub: selectedClubRef.current
      });
      
      // IMPORTANT: Always create a new object reference for React to detect the change
      const newState = {
        ...prevState,
        [clubId]: updatedMessages
      };
      
      // If this is the active club, also update the activeClubMessages state if provided
      if (clubId === activeClubId && setActiveClubMessages) {
        console.log(`[useClubMessageSubscriptions] This is the active club, updating active messages array`);
        // Trigger a state update with a completely new array
        setActiveClubMessages([...updatedMessages]);
      }
      
      return newState;
    });
  }, [activeClubId, setClubMessages, setActiveClubMessages]);
  
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
              
              safeUpdateClubMessages(
                clubId,
                null,
                prev => prev.filter(msg => {
                  const msgId = typeof msg.id === 'string' ? msg.id : 
                              (msg.id ? String(msg.id) : null);
                  const deleteId = typeof deletedMessageId === 'string' ? deletedMessageId : 
                                  String(deletedMessageId);
                  
                  return msgId !== deleteId;
                })
              );
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
        console.log(`[useClubMessageSubscriptions] New message for club ${clubId}:`, payload.new?.id);
        
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
          console.log(`[useClubMessageSubscriptions] Processing new message for club ${clubId}`, {
            messageId: messageWithSender.id,
            isActiveClub: clubId === activeClubId,
            activeClubId,
            selectedClub: selectedClubRef.current
          });
          
          // Update with the new message using our safe update function
          safeUpdateClubMessages(
            clubId,
            messageWithSender,
            prevMessages => {
              // Check if message already exists to prevent duplicates
              if (prevMessages.some(msg => msg.id === messageWithSender.id)) {
                console.log('[useClubMessageSubscriptions] Message already exists, skipping');
                return prevMessages; // Return the same array to prevent unnecessary re-renders
              }

              // Create a new array with the message appended and sorted by timestamp
              console.log('[useClubMessageSubscriptions] Adding new message to club messages array');
              return [...prevMessages, messageWithSender].sort(
                (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
              );
            }
          );
          
          // If the message is from another user and NOT the currently viewed club,
          // we need to update the unread count for this club
          if (payload.new.sender_id !== currentUser.id && 
              (!selectedClubRef.current || selectedClubRef.current !== clubId)) {
            console.log('[useClubMessageSubscriptions] Dispatching clubMessageReceived event');
            window.dispatchEvent(new CustomEvent('clubMessageReceived', { 
              detail: { clubId } 
            }));
          }
        });
      });

      channelsRef.current.push(channel);
    });
    
    return () => {
      console.log('[useClubMessageSubscriptions] Cleaning up channels due to effect cleanup');
      cleanupChannels(channelsRef.current);
      channelsRef.current = [];
      activeSubscriptionsRef.current = {};
    };
  }, [userClubs, isOpen, currentUser?.id, isSessionReady, activeClubId, safeUpdateClubMessages]);

  // Listen for club selection changes to track the currently viewed club
  useEffect(() => {
    const handleClubSelected = (e: CustomEvent) => {
      const clubId = e.detail?.clubId;
      if (clubId) {
        console.log(`[useClubMessageSubscriptions] Club selected: ${clubId} (current: ${selectedClubRef.current})`);
        selectedClubRef.current = clubId;
        
        // Mark club messages as read when selected
        if (currentUser?.id) {
          markClubMessagesAsRead(clubId);
        }
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
  }, [currentUser?.id, markClubMessagesAsRead]);
  
  // Track the active club ID
  useEffect(() => {
    if (selectedClubRef.current !== activeClubId) {
      console.log(`[useClubMessageSubscriptions] Active club ID changed: ${activeClubId} (was: ${selectedClubRef.current})`);
      selectedClubRef.current = activeClubId;
    }
  }, [activeClubId]);
};
