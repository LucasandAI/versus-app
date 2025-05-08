
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Club } from '@/types';

export const useInitialClubMessages = (
  userClubs: Club[],
  currentUserId: string | undefined,
  setClubMessages: React.Dispatch<React.SetStateAction<Record<string, any[]>>>,
  setUnreadClubs: React.Dispatch<React.SetStateAction<Set<string>>>
) => {
  useEffect(() => {
    if (!currentUserId || !userClubs.length) return;
    
    const fetchClubMessages = async () => {
      try {
        const clubIds = userClubs.map(club => club.id);
        
        // Fetch last 50 messages for each club
        const { data: messages, error } = await supabase
          .from('club_chat_messages')
          .select(`
            id,
            message,
            timestamp,
            club_id,
            sender_id,
            sender:sender_id(
              id,
              name,
              avatar
            )
          `)
          .in('club_id', clubIds)
          .order('timestamp', { ascending: true })
          .limit(50);
        
        if (error) throw error;
        
        if (messages && messages.length > 0) {
          // Group messages by club_id
          const groupedMessages = messages.reduce((acc, message) => {
            const clubId = message.club_id;
            if (!acc[clubId]) acc[clubId] = [];
            
            // Format message
            acc[clubId].push({
              id: message.id,
              text: message.message,
              timestamp: message.timestamp,
              clubId: message.club_id,
              sender: message.sender || { 
                id: message.sender_id, 
                name: 'Unknown',
                avatar: '/placeholder.svg'
              }
            });
            
            return acc;
          }, {} as Record<string, any[]>);
          
          setClubMessages(groupedMessages);
        }
        
        // Fetch unread clubs
        const { data: unreadData } = await supabase.rpc(
          'get_unread_club_messages_count',
          { user_id: currentUserId }
        );
        
        if (unreadData && unreadData > 0) {
          // Fetch specific unread clubs
          const { data: unreadClubs } = await supabase
            .from('club_chat_messages')
            .select('DISTINCT club_id')
            .neq('sender_id', currentUserId)
            .not('club_id', 'in', `(
              SELECT club_id FROM club_messages_read 
              WHERE user_id = '${currentUserId}'
            )`);
          
          if (unreadClubs && unreadClubs.length > 0) {
            setUnreadClubs(new Set(unreadClubs.map(item => item.club_id)));
          }
        }
      } catch (error) {
        console.error('Error loading initial club messages:', error);
      }
    };
    
    fetchClubMessages();
  }, [currentUserId, userClubs, setClubMessages, setUnreadClubs]);
};

export const useInitialDirectMessages = (
  currentUserId: string | undefined,
  setDirectMessages: React.Dispatch<React.SetStateAction<Record<string, any[]>>>,
  setUnreadConversations: React.Dispatch<React.SetStateAction<Set<string>>>
) => {
  useEffect(() => {
    if (!currentUserId) return;
    
    const fetchDirectMessages = async () => {
      try {
        // First get conversations
        const { data: conversations, error: convError } = await supabase
          .from('direct_conversations')
          .select('id, user1_id, user2_id')
          .or(`user1_id.eq.${currentUserId},user2_id.eq.${currentUserId}`);
        
        if (convError) throw convError;
        
        if (!conversations || conversations.length === 0) return;
        
        const conversationData: Record<string, any[]> = {};
        const unreadConvs = new Set<string>();
        
        // For each conversation, fetch messages and other user's details
        for (const conv of conversations) {
          const otherUserId = conv.user1_id === currentUserId ? conv.user2_id : conv.user1_id;
          
          // Fetch other user's details
          const { data: userData } = await supabase
            .from('users')
            .select('id, name, avatar')
            .eq('id', otherUserId)
            .single();
          
          // Fetch messages for this conversation
          const { data: messages } = await supabase
            .from('direct_messages')
            .select(`
              id,
              text,
              timestamp,
              sender_id,
              receiver_id
            `)
            .eq('conversation_id', conv.id)
            .order('timestamp', { ascending: true })
            .limit(50);
          
          if (messages && messages.length > 0) {
            // Format messages with proper sender info
            conversationData[conv.id] = await Promise.all(messages.map(async (msg) => {
              let sender;
              
              if (msg.sender_id === currentUserId) {
                sender = { 
                  id: currentUserId,
                  name: 'You',
                  avatar: '/placeholder.svg'
                };
              } else if (userData) {
                sender = {
                  id: userData.id,
                  name: userData.name,
                  avatar: userData.avatar || '/placeholder.svg'
                };
              } else {
                // Fallback - fetch sender details
                const { data: senderData } = await supabase
                  .from('users')
                  .select('id, name, avatar')
                  .eq('id', msg.sender_id)
                  .single();
                
                sender = {
                  id: msg.sender_id,
                  name: senderData?.name || 'Unknown',
                  avatar: senderData?.avatar || '/placeholder.svg'
                };
              }
              
              return {
                id: msg.id,
                text: msg.text,
                timestamp: msg.timestamp,
                conversationId: conv.id,
                receiverId: msg.receiver_id,
                sender
              };
            }));
          }
          
          // Check if there are unread messages
          const { data: unreadCheck } = await supabase
            .from('direct_messages')
            .select('id')
            .eq('conversation_id', conv.id)
            .eq('receiver_id', currentUserId)
            .not('id', 'in', `(
              SELECT message_id FROM direct_messages_read 
              WHERE user_id = '${currentUserId}'
              AND conversation_id = '${conv.id}'
            )`)
            .limit(1);
          
          if (unreadCheck && unreadCheck.length > 0) {
            unreadConvs.add(conv.id);
          }
        }
        
        setDirectMessages(conversationData);
        setUnreadConversations(unreadConvs);
      } catch (error) {
        console.error('Error loading initial direct messages:', error);
      }
    };
    
    fetchDirectMessages();
  }, [currentUserId, setDirectMessages, setUnreadConversations]);
};
