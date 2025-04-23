
import React, { useEffect, useState } from 'react';
import { Club } from '@/types';
import { SupportTicket, ChatMessage } from '@/types/chat';
import ChatDrawer from '../chat/ChatDrawer';
import { useChatDrawerGlobal } from '@/context/ChatDrawerContext';
import { supabase } from '@/integrations/supabase/client';
import { useApp } from '@/context/AppContext';
import { toast } from '@/hooks/use-toast';

interface ChatDrawerHandlerProps {
  userClubs: Club[];
  onSelectUser: (userId: string, name: string) => void;
  supportTickets: SupportTicket[];
  setUnreadMessages: (count: number) => void;
}

const ChatDrawerHandler: React.FC<ChatDrawerHandlerProps> = ({
  userClubs,
  onSelectUser,
  supportTickets: initialSupportTickets,
  setUnreadMessages
}) => {
  const { isOpen, close } = useChatDrawerGlobal();
  const { currentUser } = useApp();
  const [clubMessages, setClubMessages] = useState<Record<string, any[]>>({});
  const [fetchedSupportTickets, setFetchedSupportTickets] = useState<SupportTicket[]>([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  
  // Listen for supportTicketCreated events
  useEffect(() => {
    const handleSupportTicketCreated = () => {
      setRefreshTrigger(prev => prev + 1);
    };
    
    window.addEventListener('supportTicketCreated', handleSupportTicketCreated);
    return () => {
      window.removeEventListener('supportTicketCreated', handleSupportTicketCreated);
    };
  }, []);
  
  // Fetch club messages when drawer is opened or clubs change
  useEffect(() => {
    if (!userClubs.length || !isOpen) return;
    
    console.log('[ChatDrawerHandler] Fetching messages for clubs:', userClubs.length);
    
    const fetchClubMessages = async () => {
      try {
        const messagesPromises = userClubs.map(async (club) => {
          const { data, error } = await supabase
            .from('club_chat_messages')
            .select(`
              id, 
              message, 
              timestamp, 
              sender_id, 
              club_id,
              sender:sender_id(id, name, avatar)
            `)
            .eq('club_id', club.id)
            .order('timestamp', { ascending: true });
              
          if (error) {
            console.error(`[ChatDrawerHandler] Error fetching messages for club ${club.id}:`, error);
            return [club.id, []];
          }
          
          console.log(`[ChatDrawerHandler] Fetched ${data?.length || 0} messages for club ${club.id}`);
          return [club.id, data || []];
        });
        
        const messagesResults = await Promise.all(messagesPromises);
        const clubMessagesMap: Record<string, any[]> = {};
        
        messagesResults.forEach(([clubId, messages]) => {
          if (typeof clubId === 'string') {
            clubMessagesMap[clubId] = Array.isArray(messages) ? messages : [];
          }
        });
        
        setClubMessages(clubMessagesMap);
      } catch (error) {
        console.error('[ChatDrawerHandler] Error fetching club messages:', error);
      }
    };
    
    fetchClubMessages();
  }, [userClubs, isOpen]);
  
  // Fetch support tickets
  useEffect(() => {
    if (!currentUser || !isOpen) return;
    
    const fetchSupportTickets = async () => {
      try {
        // Get the user's support tickets
        const { data: ticketsData, error: ticketsError } = await supabase
          .from('support_tickets')
          .select('*')
          .eq('user_id', currentUser.id);
        
        if (ticketsError) {
          console.error('[ChatDrawerHandler] Error fetching support tickets:', ticketsError);
          return;
        }
        
        // Fetch messages for each ticket
        const ticketsWithMessages = await Promise.all(
          (ticketsData || []).map(async (ticket) => {
            const { data: messagesData, error: messagesError } = await supabase
              .from('support_messages')
              .select('*')
              .eq('ticket_id', ticket.id)
              .order('timestamp', { ascending: true });
            
            if (messagesError) {
              console.error(`[ChatDrawerHandler] Error fetching messages for ticket ${ticket.id}:`, messagesError);
              return null;
            }
            
            const messages: ChatMessage[] = (messagesData || []).map(msg => ({
              id: msg.id,
              text: msg.text,
              sender: {
                id: msg.sender_id,
                name: msg.is_support ? 'Support Team' : currentUser.name || 'You',
                avatar: msg.is_support ? '/placeholder.svg' : currentUser.avatar || '/placeholder.svg'
              },
              timestamp: msg.timestamp,
              isSupport: msg.is_support
            }));
            
            return {
              id: ticket.id,
              subject: ticket.subject,
              createdAt: ticket.created_at,
              messages
            };
          })
        );
        
        const validTickets = ticketsWithMessages.filter(Boolean) as SupportTicket[];
        setFetchedSupportTickets(validTickets);
      } catch (error) {
        console.error('[ChatDrawerHandler] Error in fetchSupportTickets:', error);
      }
    };
    
    fetchSupportTickets();
  }, [currentUser, isOpen, refreshTrigger]);

  // Function to send a message to a club - this will be passed to ChatDrawer
  const handleSendClubMessage = async (message: string, clubId?: string) => {
    if (!clubId) {
      console.log('[ChatDrawerHandler] No clubId provided for message');
      return;
    }
    
    console.log('[ChatDrawerHandler] Sending club message:', { 
      clubId, 
      messagePreview: message.substring(0, 20) + (message.length > 20 ? '...' : '') 
    });
    
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session?.user) {
        toast({
          title: "Error",
          description: "You must be logged in to send messages",
          variant: "destructive"
        });
        return;
      }
      
      const { data: messageData, error } = await supabase
        .from('club_chat_messages')
        .insert({
          club_id: clubId,
          message: message
        })
        .select(`
          id, 
          message, 
          timestamp, 
          sender_id, 
          club_id,
          sender:sender_id(id, name, avatar)
        `)
        .single();
        
      if (error) {
        console.error('[ChatDrawerHandler] Error sending message:', error);
        toast({
          title: "Error",
          description: "Failed to send message: " + error.message,
          variant: "destructive"
        });
        return;
      }
      
      console.log('[ChatDrawerHandler] Message sent successfully:', messageData);
      
      // Update local state
      if (messageData) {
        setClubMessages(prev => ({
          ...prev,
          [clubId]: [...(prev[clubId] || []), messageData]
        }));
      }
    } catch (error) {
      console.error('[ChatDrawerHandler] Error in handleSendClubMessage:', error);
    }
  };

  return (
    <ChatDrawer 
      open={isOpen} 
      onOpenChange={(open) => {
        if (!open) close();
      }} 
      clubs={userClubs}
      supportTickets={fetchedSupportTickets}
      clubMessages={clubMessages}
      onNewMessage={setUnreadMessages}
      onSendMessage={handleSendClubMessage}
    />
  );
};

export default ChatDrawerHandler;
