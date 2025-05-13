
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
        // Use a more efficient approach - fetch one message per club
        const clubIds = clubs.map(club => club.id);
        const queries = clubIds.map(clubId => 
          supabase
            .from('club_chat_messages')
            .select(`
              id,
              message,
              sender_id,
              club_id,
              timestamp,
              sender:sender_id(id, name, avatar)
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
            clubLastMessages[clubIds[index]] = data[0] as ClubMessage;
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

  // Subscribe to realtime updates for club messages
  useEffect(() => {
    if (clubs.length === 0) return;
    
    const clubIds = clubs.map(club => club.id);
    const channel = supabase
      .channel('club-last-messages')
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'club_chat_messages',
          filter: `club_id=in.(${clubIds.map(id => `'${id}'`).join(',')})`
        }, 
        (payload: RealtimePostgresChangesPayload<any>) => {
          // Type guard to check if payload has correct structure
          if (!payload || !payload.new || !payload.new.club_id) {
            console.log('Invalid payload received:', payload);
            return;
          }
          
          const typedPayload = payload as unknown as MessagePayload;
          const clubId = typedPayload.new.club_id;
          const isCurrentUser = typedPayload.new.sender_id === currentUser?.id;
          
          // Check if this club is relevant to the user
          const isRelevantClub = clubsRef.current.some(club => club.id === clubId);
          if (!isRelevantClub) return;

          console.log(`[useClubLastMessages] New message for club ${clubId}`);
          
          // Create a temporary message with basic sender info
          const tempMessage: ClubMessage = {
            ...typedPayload.new,
            sender: isCurrentUser 
              ? { id: currentUser?.id, name: 'You', avatar: currentUser?.avatar } 
              : { id: typedPayload.new.sender_id, name: 'Loading...', avatar: undefined }
          };
          
          // Update with the new message
          setLastMessages(prev => ({
            ...prev,
            [clubId]: tempMessage
          }));

          // Only fetch sender details if not current user
          if (!isCurrentUser) {
            // Check if we already have this sender cached
            if (senderCache[typedPayload.new.sender_id]) {
              // Use cached data
              const cachedSender = senderCache[typedPayload.new.sender_id];
              setLastMessages(prev => ({
                ...prev,
                [clubId]: {
                  ...prev[clubId],
                  sender: {
                    id: typedPayload.new.sender_id,
                    name: cachedSender.name,
                    avatar: cachedSender.avatar
                  }
                }
              }));
            } else {
              // Fetch sender details from database
              supabase
                .from('users')
                .select('id, name, avatar')
                .eq('id', typedPayload.new.sender_id)
                .single()
                .then(({ data, error }) => {
                  if (!error && data) {
                    // Update with complete sender data
                    setLastMessages(prev => ({
                      ...prev,
                      [clubId]: {
                        ...prev[clubId],
                        sender: data
                      }
                    }));
                    
                    // Cache this sender
                    setSenderCache(prev => ({
                      ...prev,
                      [typedPayload.new.sender_id]: {
                        name: data.name,
                        avatar: data.avatar
                      }
                    }));
                  }
                });
            }
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
