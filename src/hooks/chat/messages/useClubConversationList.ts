
import React from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Club } from '@/types';
import { toast } from '@/hooks/use-toast';

export interface ClubConversationPreview {
  club: Club;
  lastMessage: any | null;
}

export function useClubConversationList(clubs: Club[]) {
  console.log('[useClubConversationList] Hook called with clubs:', clubs.map(c => c.id));
  const [conversations, setConversations] = React.useState<ClubConversationPreview[]>([]);

  // Memoize clubIds for effect dependencies
  const clubIds = React.useMemo(() => clubs.map(c => c.id), [clubs]);

  // Helper to fetch the latest message for a club from the view
  const fetchLastMessage = async (clubId: string) => {
    const { data, error } = await supabase
      .from('club_chat_messages_with_usernames')
      .select('*')
      .eq('club_id', clubId)
      .order('timestamp', { ascending: false })
      .limit(1);
    console.log('[fetchLastMessage]', { clubId, data, error });
    if (error) return null;
    return data && data[0] ? data[0] : null;
  };

  // Memoize fetchAll to only depend on clubIds
  const fetchAll = React.useCallback(async () => {
    if (!clubIds.length) {
      setConversations([]);
      return;
    }
    const previews: ClubConversationPreview[] = await Promise.all(
      clubIds.map(async (clubId) => {
        const club = clubs.find(c => c.id === clubId);
        const lastMessage = await fetchLastMessage(clubId);
        return { club, lastMessage };
      })
    );
    
    // Sort by most recent message timestamp
    previews.sort((a, b) => {
      const tA = a.lastMessage ? new Date(a.lastMessage.timestamp).getTime() : 0;
      const tB = b.lastMessage ? new Date(b.lastMessage.timestamp).getTime() : 0;
      return tB - tA;
    });
    
    setConversations(previews);
    console.log('[useClubConversationList] fetchAll setConversations:', previews);
  }, [clubIds, clubs]);

  // Handle real-time update of a specific club conversation
  const updateConversationWithNewMessage = React.useCallback(async (payload: any) => {
    try {
      console.log('[useClubConversationList] Received real-time message update:', payload);
      
      if (!payload.new || !payload.new.club_id) {
        console.error('[useClubConversationList] Invalid payload received:', payload);
        return;
      }
      
      const clubId = payload.new.club_id;
      
      // Find the affected club
      const club = clubs.find(c => c.id === clubId);
      if (!club) {
        console.log('[useClubConversationList] Message for unknown club:', clubId);
        return;
      }
      
      // Get the full message details including sender info
      const messageWithSender = await supabase
        .from('club_chat_messages_with_usernames')
        .select('*')
        .eq('club_id', clubId)
        .eq('message_id', payload.new.id)
        .single();
        
      if (messageWithSender.error) {
        console.error('[useClubConversationList] Error fetching message details:', messageWithSender.error);
        return;
      }
      
      const newMessage = messageWithSender.data;
      
      // Update the conversations state directly
      setConversations(prevConversations => {
        // Find if this club already exists in our conversations
        const existingIndex = prevConversations.findIndex(c => c.club.id === clubId);
        
        // Create a copy of the existing conversations
        const updatedConversations = [...prevConversations];
        
        if (existingIndex >= 0) {
          // Update the existing club conversation with the new message
          updatedConversations[existingIndex] = {
            ...updatedConversations[existingIndex],
            lastMessage: newMessage
          };
        } else if (club) {
          // If the club conversation doesn't exist yet, add it
          updatedConversations.push({
            club,
            lastMessage: newMessage
          });
        }
        
        // Re-sort conversations based on message timestamp
        return updatedConversations.sort((a, b) => {
          const tA = a.lastMessage ? new Date(a.lastMessage.timestamp).getTime() : 0;
          const tB = b.lastMessage ? new Date(b.lastMessage.timestamp).getTime() : 0;
          return tB - tA;
        });
      });
      
      console.log('[useClubConversationList] Updated conversation with new message for club:', clubId);
    } catch (error) {
      console.error('[useClubConversationList] Error updating conversation:', error);
      toast({
        title: "Error updating conversation",
        description: "Something went wrong while updating the conversation",
        variant: "destructive"
      });
    }
  }, [clubs]);

  // Initial fetch
  React.useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // Real-time subscription: directly update the specific conversation on new messages
  React.useEffect(() => {
    console.log('[useClubConversationList] Real-time effect running with clubs:', clubs.map(c => c.id));
    if (!clubIds.length) return;
    
    const channel = supabase
      .channel('club-conversation-list-realtime')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'club_chat_messages',
        filter: `club_id=in.(${clubIds.map(id => `'${id}'`).join(',')})`
      }, async (payload) => {
        console.log('[useClubConversationList] Real-time event received:', payload);
        await updateConversationWithNewMessage(payload);
      })
      .subscribe();
      
    return () => { supabase.removeChannel(channel); };
  }, [clubIds, updateConversationWithNewMessage]);

  console.log('[useClubConversationList] Returning conversations:', conversations);
  return conversations;
}
