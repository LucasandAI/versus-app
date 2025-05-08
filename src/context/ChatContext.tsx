
import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Club, User } from '@/types';
import { v4 as uuidv4 } from '@supabase/supabase-js';
import { useApp } from './AppContext';
import { toast } from "@/hooks/use-toast";

// Define our message types
export interface ChatMessage {
  id: string;
  text: string;
  sender: {
    id: string;
    name: string;
    avatar?: string;
  };
  timestamp: string;
  optimistic?: boolean;
  status?: 'sending' | 'sent' | 'error';
}

export interface ClubMessage extends ChatMessage {
  clubId: string;
}

export interface DirectMessage extends ChatMessage {
  conversationId: string;
  receiverId: string;
}

interface ChatContextType {
  // Messages state
  clubMessages: Record<string, ClubMessage[]>;
  directMessages: Record<string, DirectMessage[]>;
  
  // Selected states
  selectedClub: Club | null;
  selectedConversation: {
    id: string;
    user: {
      id: string;
      name: string;
      avatar?: string;
    };
  } | null;
  
  // Unread state
  unreadClubs: Set<string>;
  unreadConversations: Set<string>;
  
  // Actions
  setSelectedClub: (club: Club | null) => void;
  setSelectedConversation: (conversation: { id: string; user: { id: string; name: string; avatar?: string; } } | null) => void;
  sendClubMessage: (clubId: string, text: string) => Promise<void>;
  sendDirectMessage: (conversationId: string, receiverId: string, text: string) => Promise<void>;
  markClubAsRead: (clubId: string) => void;
  markConversationAsRead: (conversationId: string) => void;
  deleteMessage: (messageId: string, type: 'club' | 'direct', contextId: string) => Promise<void>;
}

// Create the context with a default value
const ChatContext = createContext<ChatContextType | undefined>(undefined);

// Provider component
export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useApp();
  
  // Message states
  const [clubMessages, setClubMessages] = useState<Record<string, ClubMessage[]>>({});
  const [directMessages, setDirectMessages] = useState<Record<string, DirectMessage[]>>({});
  
  // Selection states
  const [selectedClub, setSelectedClub] = useState<Club | null>(null);
  const [selectedConversation, setSelectedConversation] = useState<{
    id: string;
    user: {
      id: string;
      name: string;
      avatar?: string;
    };
  } | null>(null);
  
  // Unread states
  const [unreadClubs, setUnreadClubs] = useState<Set<string>>(new Set());
  const [unreadConversations, setUnreadConversations] = useState<Set<string>>(new Set());
  
  // Reference to active subscriptions
  const subscriptionsRef = useRef<any[]>([]);
  
  // Clean up subscriptions on unmount
  useEffect(() => {
    return () => {
      subscriptionsRef.current.forEach(subscription => {
        if (subscription) {
          supabase.removeChannel(subscription);
        }
      });
    };
  }, []);
  
  // Set up real-time subscriptions when the current user changes
  useEffect(() => {
    if (!currentUser) return;
    
    // Clean up any existing subscriptions
    subscriptionsRef.current.forEach(subscription => {
      if (subscription) {
        supabase.removeChannel(subscription);
      }
    });
    subscriptionsRef.current = [];
    
    // Subscribe to club message changes
    const clubChannel = supabase.channel('club-messages')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'club_chat_messages'
      }, handleNewClubMessage)
      .subscribe();
    
    // Subscribe to direct message changes
    const dmChannel = supabase.channel('direct-messages')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'direct_messages'
      }, handleNewDirectMessage)
      .subscribe();
    
    subscriptionsRef.current.push(clubChannel, dmChannel);
    
    return () => {
      // Clean up subscriptions
      [clubChannel, dmChannel].forEach(channel => {
        supabase.removeChannel(channel);
      });
    };
  }, [currentUser]);
  
  // Handle incoming new club message
  const handleNewClubMessage = async (payload: any) => {
    if (!currentUser) return;
    
    const message = payload.new;
    if (!message || !message.club_id) return;
    
    // Skip messages sent by the current user (as they are handled by optimistic updates)
    if (message.sender_id === currentUser.id) return;
    
    try {
      // Fetch sender information if needed
      let sender = { id: message.sender_id, name: 'Unknown', avatar: '/placeholder.svg' };
      
      // If sender information is not included in the message, fetch it
      if (!message.sender) {
        const { data: userData } = await supabase
          .from('users')
          .select('id, name, avatar')
          .eq('id', message.sender_id)
          .single();
          
        if (userData) {
          sender = {
            id: userData.id,
            name: userData.name,
            avatar: userData.avatar
          };
        }
      } else {
        sender = message.sender;
      }
      
      const clubMessage: ClubMessage = {
        id: message.id,
        text: message.message,
        sender,
        timestamp: message.timestamp || new Date().toISOString(),
        clubId: message.club_id
      };
      
      setClubMessages(prev => {
        const clubId = message.club_id;
        const existing = prev[clubId] || [];
        
        // Check for duplicates
        if (existing.some(msg => msg.id === message.id)) {
          return prev;
        }
        
        return {
          ...prev,
          [clubId]: [...existing, clubMessage]
        };
      });
      
      // Mark as unread if not the selected club
      if (selectedClub?.id !== message.club_id) {
        setUnreadClubs(prev => {
          const newSet = new Set(prev);
          newSet.add(message.club_id);
          return newSet;
        });
      }
    } catch (error) {
      console.error('Error processing incoming club message:', error);
    }
  };
  
  // Handle incoming new direct message
  const handleNewDirectMessage = async (payload: any) => {
    if (!currentUser) return;
    
    const message = payload.new;
    if (!message || !message.conversation_id) return;
    
    // Skip messages sent by the current user (as they are handled by optimistic updates)
    if (message.sender_id === currentUser.id) return;
    
    try {
      // Fetch sender information if needed
      let sender = { id: message.sender_id, name: 'Unknown', avatar: '/placeholder.svg' };
      
      const { data: userData } = await supabase
        .from('users')
        .select('id, name, avatar')
        .eq('id', message.sender_id)
        .single();
        
      if (userData) {
        sender = {
          id: userData.id,
          name: userData.name,
          avatar: userData.avatar
        };
      }
      
      const directMessage: DirectMessage = {
        id: message.id,
        text: message.text,
        sender,
        timestamp: message.timestamp || new Date().toISOString(),
        conversationId: message.conversation_id,
        receiverId: message.receiver_id
      };
      
      setDirectMessages(prev => {
        const conversationId = message.conversation_id;
        const existing = prev[conversationId] || [];
        
        // Check for duplicates
        if (existing.some(msg => msg.id === message.id)) {
          return prev;
        }
        
        return {
          ...prev,
          [conversationId]: [...existing, directMessage]
        };
      });
      
      // Mark as unread if not the selected conversation
      if (selectedConversation?.id !== message.conversation_id) {
        setUnreadConversations(prev => {
          const newSet = new Set(prev);
          newSet.add(message.conversation_id);
          return newSet;
        });
      }
    } catch (error) {
      console.error('Error processing incoming direct message:', error);
    }
  };
  
  // Send a club message with optimistic updates
  const sendClubMessage = useCallback(async (clubId: string, text: string) => {
    if (!currentUser || !text.trim() || !clubId) return;
    
    // Generate temporary id for optimistic update
    const tempId = `temp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    
    // Create optimistic message
    const optimisticMessage: ClubMessage = {
      id: tempId,
      text: text.trim(),
      sender: {
        id: currentUser.id,
        name: currentUser.name || 'You',
        avatar: currentUser.avatar
      },
      timestamp: new Date().toISOString(),
      clubId,
      optimistic: true,
      status: 'sending'
    };
    
    // Add to state immediately (optimistic update)
    setClubMessages(prev => {
      const existing = prev[clubId] || [];
      return {
        ...prev,
        [clubId]: [...existing, optimisticMessage]
      };
    });
    
    try {
      // Send to server
      const { data, error } = await supabase
        .from('club_chat_messages')
        .insert({
          club_id: clubId,
          message: text.trim(),
          sender_id: currentUser.id
        })
        .select()
        .single();
      
      if (error) throw error;
      
      // Update the optimistic message with the real server data
      setClubMessages(prev => {
        const existing = prev[clubId] || [];
        
        return {
          ...prev,
          [clubId]: existing.map(msg => {
            if (msg.id === tempId) {
              return {
                ...msg,
                id: data.id,
                optimistic: false,
                status: 'sent',
                timestamp: data.timestamp || msg.timestamp
              };
            }
            return msg;
          })
        };
      });
    } catch (error) {
      console.error('Error sending club message:', error);
      
      // Mark the optimistic message as failed
      setClubMessages(prev => {
        const existing = prev[clubId] || [];
        
        return {
          ...prev,
          [clubId]: existing.map(msg => {
            if (msg.id === tempId) {
              return { ...msg, status: 'error' };
            }
            return msg;
          })
        };
      });
      
      toast({
        title: "Message failed to send",
        description: "Please try again",
        variant: "destructive"
      });
    }
  }, [currentUser]);
  
  // Send a direct message with optimistic updates
  const sendDirectMessage = useCallback(async (conversationId: string, receiverId: string, text: string) => {
    if (!currentUser || !text.trim() || !conversationId || !receiverId) return;
    
    // Generate temporary id for optimistic update
    const tempId = `temp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    
    // Create optimistic message
    const optimisticMessage: DirectMessage = {
      id: tempId,
      text: text.trim(),
      sender: {
        id: currentUser.id,
        name: currentUser.name || 'You',
        avatar: currentUser.avatar
      },
      timestamp: new Date().toISOString(),
      conversationId,
      receiverId,
      optimistic: true,
      status: 'sending'
    };
    
    // Add to state immediately (optimistic update)
    setDirectMessages(prev => {
      const existing = prev[conversationId] || [];
      return {
        ...prev,
        [conversationId]: [...existing, optimisticMessage]
      };
    });
    
    try {
      // Special handling for 'new' conversation
      let finalConversationId = conversationId;
      
      if (conversationId === 'new') {
        // Create a new conversation first
        const { data: convData, error: convError } = await supabase
          .from('direct_conversations')
          .insert({
            user1_id: currentUser.id,
            user2_id: receiverId
          })
          .select('id')
          .single();
        
        if (convError) throw convError;
        
        finalConversationId = convData.id;
        
        // Update the state with the new conversation ID
        setDirectMessages(prev => {
          const existing = prev['new'] || [];
          
          // Remove from 'new' and add to the real conversation ID
          const newState = { ...prev };
          delete newState['new'];
          
          return {
            ...newState,
            [finalConversationId]: existing.map(msg => ({
              ...msg,
              conversationId: finalConversationId
            }))
          };
        });
        
        // Update selected conversation if needed
        if (selectedConversation && selectedConversation.id === 'new') {
          setSelectedConversation({
            ...selectedConversation,
            id: finalConversationId
          });
        }
      }
      
      // Send to server
      const { data, error } = await supabase
        .from('direct_messages')
        .insert({
          conversation_id: finalConversationId,
          sender_id: currentUser.id,
          receiver_id: receiverId,
          text: text.trim()
        })
        .select()
        .single();
      
      if (error) throw error;
      
      // Update the optimistic message with the real server data
      setDirectMessages(prev => {
        const existing = prev[finalConversationId] || [];
        
        return {
          ...prev,
          [finalConversationId]: existing.map(msg => {
            if (msg.id === tempId) {
              return {
                ...msg,
                id: data.id,
                optimistic: false,
                status: 'sent',
                timestamp: data.timestamp || msg.timestamp
              };
            }
            return msg;
          })
        };
      });
    } catch (error) {
      console.error('Error sending direct message:', error);
      
      // Mark the optimistic message as failed
      setDirectMessages(prev => {
        const conversationKey = conversationId === 'new' ? 'new' : conversationId;
        const existing = prev[conversationKey] || [];
        
        return {
          ...prev,
          [conversationKey]: existing.map(msg => {
            if (msg.id === tempId) {
              return { ...msg, status: 'error' };
            }
            return msg;
          })
        };
      });
      
      toast({
        title: "Message failed to send",
        description: "Please try again",
        variant: "destructive"
      });
    }
  }, [currentUser, selectedConversation]);
  
  // Mark club as read
  const markClubAsRead = useCallback(async (clubId: string) => {
    if (!currentUser || !clubId) return;
    
    // Optimistic update
    setUnreadClubs(prev => {
      const newSet = new Set(prev);
      newSet.delete(clubId);
      return newSet;
    });
    
    try {
      // Update the last read timestamp in the database
      await supabase
        .from('club_messages_read')
        .upsert({
          club_id: clubId,
          user_id: currentUser.id,
          last_read_timestamp: new Date().toISOString()
        }, {
          onConflict: 'club_id,user_id'
        });
    } catch (error) {
      console.error('Error marking club as read:', error);
    }
  }, [currentUser]);
  
  // Mark conversation as read
  const markConversationAsRead = useCallback(async (conversationId: string) => {
    if (!currentUser || !conversationId || conversationId === 'new') return;
    
    // Optimistic update
    setUnreadConversations(prev => {
      const newSet = new Set(prev);
      newSet.delete(conversationId);
      return newSet;
    });
    
    try {
      // Update the last read timestamp in the database
      await supabase
        .from('direct_messages_read')
        .upsert({
          conversation_id: conversationId,
          user_id: currentUser.id,
          last_read_timestamp: new Date().toISOString()
        }, {
          onConflict: 'conversation_id,user_id'
        });
    } catch (error) {
      console.error('Error marking conversation as read:', error);
    }
  }, [currentUser]);
  
  // Delete a message
  const deleteMessage = useCallback(async (messageId: string, type: 'club' | 'direct', contextId: string) => {
    if (!messageId || !type || !contextId) return;
    
    // Handle optimistic message deletions differently
    if (messageId.startsWith('temp-')) {
      if (type === 'club') {
        setClubMessages(prev => {
          const existing = prev[contextId] || [];
          return {
            ...prev,
            [contextId]: existing.filter(msg => msg.id !== messageId)
          };
        });
      } else {
        setDirectMessages(prev => {
          const existing = prev[contextId] || [];
          return {
            ...prev,
            [contextId]: existing.filter(msg => msg.id !== messageId)
          };
        });
      }
      return;
    }
    
    try {
      // Optimistic delete
      if (type === 'club') {
        setClubMessages(prev => {
          const existing = prev[contextId] || [];
          return {
            ...prev,
            [contextId]: existing.filter(msg => msg.id !== messageId)
          };
        });
        
        // Delete from database
        await supabase
          .from('club_chat_messages')
          .delete()
          .eq('id', messageId);
      } else {
        setDirectMessages(prev => {
          const existing = prev[contextId] || [];
          return {
            ...prev,
            [contextId]: existing.filter(msg => msg.id !== messageId)
          };
        });
        
        // Delete from database
        await supabase
          .from('direct_messages')
          .delete()
          .eq('id', messageId);
      }
    } catch (error) {
      console.error('Error deleting message:', error);
      toast({
        title: "Delete failed",
        description: "Could not delete the message",
        variant: "destructive"
      });
    }
  }, []);
  
  // Provide the context value
  const contextValue = {
    clubMessages,
    directMessages,
    selectedClub,
    selectedConversation,
    unreadClubs,
    unreadConversations,
    setSelectedClub,
    setSelectedConversation,
    sendClubMessage,
    sendDirectMessage,
    markClubAsRead,
    markConversationAsRead,
    deleteMessage
  };
  
  return (
    <ChatContext.Provider value={contextValue}>
      {children}
    </ChatContext.Provider>
  );
};

// Custom hook to use the chat context
export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};
