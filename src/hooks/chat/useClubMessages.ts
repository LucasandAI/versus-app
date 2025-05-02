
import { useState, useEffect, useRef } from 'react';
import { Club } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { useApp } from '@/context/AppContext';
import { useClubMessageSubscriptions } from '@/hooks/chat/messages/useClubMessageSubscriptions';

export const useClubMessages = (userClubs: Club[], isOpen: boolean) => {
  const [clubMessages, setClubMessages] = useState<Record<string, any[]>>({});
  const [activeClubId, setActiveClubId] = useState<string | null>(null);
  const [activeClubMessages, setActiveClubMessages] = useState<any[]>([]);
  const { currentUser } = useApp();
  const activeSubscriptionsRef = useRef<Record<string, boolean>>({});
  const initialFetchDoneRef = useRef<Record<string, boolean>>({});
  
  // Fetch initial messages when drawer opens
  useEffect(() => {
    if (!isOpen || !currentUser?.id || !userClubs.length) return;
    
    const fetchInitialMessages = async () => {
      try {
        // Get club IDs that haven't been fetched yet
        const clubIds = userClubs
          .filter(club => !initialFetchDoneRef.current[club.id])
          .map(club => club.id);
        
        if (clubIds.length === 0) {
          console.log('[useClubMessages] All clubs already fetched, skipping');
          return;
        }
        
        console.log('[useClubMessages] Fetching initial messages for clubs:', clubIds);
        
        const { data, error } = await supabase
          .from('club_chat_messages')
          .select(`
            id, 
            message, 
            sender_id, 
            club_id, 
            timestamp,
            sender:sender_id (
              id, 
              name, 
              avatar
            )
          `)
          .in('club_id', clubIds)
          .order('timestamp', { ascending: false })
          .limit(50);
          
        if (error) throw error;
        
        if (data) {
          // Use a functional update to ensure we're working with the latest state
          setClubMessages(prevMessages => {
            const messagesMap = {...prevMessages};
            
            // Group messages by club_id
            data.forEach(message => {
              if (!messagesMap[message.club_id]) {
                messagesMap[message.club_id] = [];
              }
              
              // Only add if not already present
              if (!messagesMap[message.club_id].some(m => m.id === message.id)) {
                messagesMap[message.club_id].push(message);
              }
            });
            
            // Sort messages by timestamp (oldest first) for each club
            Object.keys(messagesMap).forEach(clubId => {
              messagesMap[clubId] = messagesMap[clubId].sort(
                (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
              );
            });
            
            // Mark clubs as fetched
            clubIds.forEach(clubId => {
              initialFetchDoneRef.current[clubId] = true;
            });
            
            console.log('[useClubMessages] Initial messages organized:', Object.keys(messagesMap).length);
            
            // If we have an active club, update its messages
            if (activeClubId && messagesMap[activeClubId]) {
              setActiveClubMessages([...messagesMap[activeClubId]]);
            }
            
            return messagesMap;
          });
        }
      } catch (error) {
        console.error('[useClubMessages] Error fetching initial messages:', error);
      }
    };
    
    fetchInitialMessages();
  }, [isOpen, currentUser?.id, userClubs, activeClubId]);
  
  // Update active club messages when activeClubId changes
  useEffect(() => {
    if (activeClubId && clubMessages[activeClubId]) {
      console.log('[useClubMessages] Updating active club messages for:', activeClubId);
      setActiveClubMessages([...clubMessages[activeClubId]]);
    } else {
      setActiveClubMessages([]);
    }
  }, [activeClubId, clubMessages]);
  
  // Listen for club selection events
  useEffect(() => {
    const handleClubSelected = (e: CustomEvent) => {
      const clubId = e.detail?.clubId;
      if (clubId) {
        console.log('[useClubMessages] Club selected:', clubId);
        setActiveClubId(clubId);
      }
    };

    const handleClubDeselected = () => {
      console.log('[useClubMessages] Club deselected');
      setActiveClubId(null);
    };
    
    window.addEventListener('clubSelected', handleClubSelected as EventListener);
    window.addEventListener('clubDeselected', handleClubDeselected);
    
    return () => {
      window.removeEventListener('clubSelected', handleClubSelected as EventListener);
      window.removeEventListener('clubDeselected', handleClubDeselected);
    };
  }, []);
  
  // Set up real-time subscription for messages
  useClubMessageSubscriptions(
    userClubs,
    isOpen,
    activeSubscriptionsRef,
    setClubMessages,
    activeClubId,
    setActiveClubMessages
  );
  
  // Safe setter function that ensures we're always creating a new object reference
  const safeSetClubMessages = (updater: React.SetStateAction<Record<string, any[]>>) => {
    setClubMessages(prevState => {
      const nextState = typeof updater === 'function' ? updater(prevState) : updater;
      
      console.log('[useClubMessages] Updating messages state:', {
        prevClubIds: Object.keys(prevState).length,
        nextClubIds: Object.keys(nextState).length
      });
      
      // If we have an active club, also update its messages
      if (activeClubId && nextState[activeClubId]) {
        setActiveClubMessages([...nextState[activeClubId]]);
      }
      
      // Always return a new object to ensure React detects changes
      return {...nextState};
    });
  };
  
  return {
    clubMessages,
    setClubMessages: safeSetClubMessages,
    activeClubId,
    setActiveClubId,
    activeClubMessages,
    setActiveClubMessages
  };
};

export default useClubMessages;
