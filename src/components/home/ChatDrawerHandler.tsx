
import React, { useEffect, useState } from 'react';
import { Club } from '@/types';
import { SupportTicket, ChatMessage } from '@/types/chat';
import ChatDrawer from '../chat/ChatDrawer';
import { useChatDrawerGlobal } from '@/context/ChatDrawerContext';
import { supabase } from '@/integrations/supabase/client';
import { useApp } from '@/context/AppContext';

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
  
  // Fetch club messages when drawer is opened
  useEffect(() => {
    if (!userClubs.length) return;
    
    const fetchClubMessages = async () => {
      try {
        const messagesPromises = userClubs.map(async (club) => {
          const { data, error } = await supabase
            .from('club_chat_messages')
            .select('id, message, timestamp, sender_id, club_id')
            .eq('club_id', club.id)
            .order('timestamp', { ascending: true });
              
          if (error) {
            console.error(`Error fetching messages for club ${club.id}:`, error);
            return [club.id, []];
          }
          
          // Convert Supabase data shape to ChatMessage shape
          const messages = (data || []).map(msg => ({
            id: msg.id,
            text: msg.message,
            sender: {
              id: msg.sender_id,
              name: "", // Will be populated in ChatMessages component
              avatar: ""
            },
            timestamp: msg.timestamp,
          }));
          
          return [club.id, messages];
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
        console.error('Error fetching club messages:', error);
      }
    };
    
    fetchClubMessages();
    
    // Set up a real-time listener for new messages
    const channel = supabase
      .channel('public:club_chat_messages')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'club_chat_messages' }, 
        payload => {
          const clubId = payload.new.club_id;
          const existingClub = userClubs.find(club => club.id === clubId);
          
          if (existingClub) {
            setClubMessages(prev => {
              const newMessage = {
                id: payload.new.id,
                text: payload.new.message,
                sender: {
                  id: payload.new.sender_id,
                  name: "", // Will be populated in ChatMessages component
                  avatar: ""
                },
                timestamp: payload.new.timestamp,
              };
              
              return {
                ...prev,
                [clubId]: [...(prev[clubId] || []), newMessage]
              };
            });
          }
        }
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, [userClubs]);
  
  // Fetch support tickets
  useEffect(() => {
    if (!currentUser) return;
    
    const fetchSupportTickets = async () => {
      try {
        // Get the user's support tickets
        const { data: ticketsData, error: ticketsError } = await supabase
          .from('support_tickets')
          .select('*')
          .eq('user_id', currentUser.id);
        
        if (ticketsError) {
          console.error('Error fetching support tickets:', ticketsError);
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
              console.error(`Error fetching messages for ticket ${ticket.id}:`, messagesError);
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
        console.error('Error in fetchSupportTickets:', error);
      }
    };
    
    fetchSupportTickets();
    
    // Set up real-time listener for support tickets and messages
    const channel = supabase
      .channel('public:support')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'support_tickets', filter: `user_id=eq.${currentUser.id}` }, 
        () => {
          fetchSupportTickets();
        }
      )
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'support_messages' }, 
        () => {
          fetchSupportTickets();
        }
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUser, refreshTrigger]);

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
    />
  );
};

export default ChatDrawerHandler;
