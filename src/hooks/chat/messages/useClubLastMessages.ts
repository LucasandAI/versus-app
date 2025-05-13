
import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { Club } from '@/types';
import { useApp } from '@/context/AppContext';

interface ClubMessage {
  id: string;
  message: string;
  sender_id: string;
  club_id: string;
  timestamp: string;
  sender?: {
    id: string;
    name: string;
    avatar?: string;
  };
  [key: string]: any;
}

interface MessagePayload {
  new: {
    id: string;
    club_id: string;
    message: string;
    sender_id: string;
    timestamp: string;
    sender_name?: string;
    [key: string]: any;
  };
  [key: string]: any;
}

export const useClubLastMessages = (clubs: Club[]) => {
  const [lastMessages, setLastMessages] = useState<Record<string, ClubMessage>>({});
  const [isLoading, setIsLoading] = useState(false);
  const clubsRef = useRef<Club[]>(clubs);
  const { currentUser } = useApp();
  const [senderCache, setSenderCache] = useState<Record<string, {name: string, avatar?: string}>>({});

  // Update the reference when clubs change
  useEffect(() => {
    clubsRef.current = clubs;
  }, [clubs]);

  // Pre-load all user data for caching
  useEffect(() => {
    const fetchAllSenderData = async () => {
      if (clubs.length === 0) return;
      
      try {
        // Get all unique sender IDs from last messages
        const senderIds = Object.values(lastMessages)
          .map(msg => msg.sender_id)
          .filter(id => id && !senderCache[id]) // Skip already cached and null IDs
          .filter((id, index, array) => array.indexOf(id) === index); // Unique only
        
        if (senderIds.length === 0) return;
        
        const { data } = await supabase
          .from('users')
          .select('id, name, avatar')
          .in('id', senderIds);
          
        if (data && data.length > 0) {
          const newCache = { ...senderCache };
          data.forEach(user => {
            newCache[user.id] = { name: user.name, avatar: user.avatar };
          });
          setSenderCache(newCache);
        }
      } catch (error) {
        console.error('Failed to fetch sender details:', error);
      }
    };
    
    fetchAllSenderData();
  }, [lastMessages, clubs]);

  // Fetch last messages for all clubs on mount and when clubs change
  useEffect(() => {
    const fetchLastMessages = async () => {
      if (clubs.length === 0) return;

      setIsLoading(true);
      try {
        // Use the view to get last messages with sender names
        const clubIds = clubs.map(club => club.id);
        const queries = clubIds.map(clubId => 
          supabase
            .from('club_chat_messages_with_usernames')
            .select(`
              message_id,
              message,
              sender_id,
              club_id,
              timestamp,
              sender_name
            `)
            .eq('club_id', clubId)
            .order('timestamp', { ascending: false })
            .limit(1)
        );
        
        // Run queries in parallel
        const results = await Promise.all(queries);
        
        // Process results
        const clubLastMessages: Record<string, ClubMessage> = {};
        results.forEach((result, index) => {
          const { data, error } = result;
          if (error) {
            console.error(`Error fetching club messages for ${clubIds[index]}:`, error);
          } else if (data && data.length > 0) {
            // Map from view structure to ClubMessage structure
            clubLastMessages[clubIds[index]] = {
              id: data[0].message_id,
              message: data[0].message,
              sender_id: data[0].sender_id,
              club_id: data[0].club_id,
              timestamp: data[0].timestamp,
              sender: {
                id: data[0].sender_id,
                name: data[0].sender_name || 'Unknown',
                avatar: undefined // We'll fetch avatars separately if needed
              }
            };
          }
        });

        setLastMessages(clubLastMessages);
      } catch (error) {
        console.error('Failed to fetch last messages:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLastMessages();
  }, [clubs]);

  // Subscribe to realtime updates for club messages using the view
  useEffect(() => {
    if (clubs.length === 0) return;
    
    const clubIds = clubs.map(club => club.id);
    console.log('[useClubLastMessages] Setting up subscription for clubs:', clubIds);
    
    const channel = supabase
      .channel('club-last-messages-view')
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'club_chat_messages_with_usernames',
          filter: `club_id=in.(${clubIds.map(id => `'${id}'`).join(',')})`
        }, 
        (payload: RealtimePostgresChangesPayload<any>) => {
          // Type guard to check if payload has correct structure
          if (!payload || !payload.new || !payload.new.club_id) {
            console.log('[useClubLastMessages] Invalid payload received:', payload);
            return;
          }
          
          const typedPayload = payload as unknown as MessagePayload;
          const clubId = typedPayload.new.club_id;
          const isCurrentUser = typedPayload.new.sender_id === currentUser?.id;
          
          // Check if this club is relevant to the user
          const isRelevantClub = clubsRef.current.some(club => club.id === clubId);
          if (!isRelevantClub) return;

          console.log(`[useClubLastMessages] New message from view for club ${clubId}: ${typedPayload.new.message}`);
          
          // Create a message with sender info directly from the view
          const newMessage: ClubMessage = {
            id: typedPayload.new.id,
            message: typedPayload.new.message,
            sender_id: typedPayload.new.sender_id,
            club_id: typedPayload.new.club_id,
            timestamp: typedPayload.new.timestamp,
            sender: {
              id: typedPayload.new.sender_id,
              name: isCurrentUser ? 'You' : (typedPayload.new.sender_name || 'Unknown'),
              avatar: isCurrentUser ? currentUser?.avatar : undefined
            }
          };
          
          // Update with the new message immediately - no need for separate query
          setLastMessages(prev => ({
            ...prev,
            [clubId]: newMessage
          }));

          // If this is not from the current user, we could still fetch avatar if needed
          if (!isCurrentUser && !senderCache[typedPayload.new.sender_id]) {
            // Fetch just the avatar if needed
            supabase
              .from('users')
              .select('id, avatar')
              .eq('id', typedPayload.new.sender_id)
              .single()
              .then(({ data, error }) => {
                if (!error && data) {
                  // Update sender cache with avatar
                  setSenderCache(prev => ({
                    ...prev,
                    [typedPayload.new.sender_id]: {
                      name: typedPayload.new.sender_name || 'Unknown',
                      avatar: data.avatar
                    }
                  }));
                  
                  // Update message with avatar
                  setLastMessages(prev => ({
                    ...prev,
                    [clubId]: {
                      ...prev[clubId],
                      sender: {
                        ...prev[clubId].sender,
                        avatar: data.avatar
                      }
                    }
                  }));
                }
              });
          }
        })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [clubs, currentUser?.id, senderCache]);

  return {
    lastMessages,
    isLoading,
    senderCache
  };
};
