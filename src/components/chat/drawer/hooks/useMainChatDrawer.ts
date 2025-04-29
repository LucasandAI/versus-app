
import { useState, useEffect } from 'react';
import { Club } from '@/types';
import { useChatActions } from '@/hooks/chat/useChatActions';
import { useApp } from '@/context/AppContext';
import { useDirectConversationsContext } from '@/context/direct-conversations';
import { useUnreadMessages } from '@/context/unread-messages';

export interface DMUser {
  userId: string;
  userName: string;
  userAvatar: string;
  conversationId: string;
}

export const useMainChatDrawer = (
  open: boolean,
  onOpenChange: (open: boolean) => void,
) => {
  const [activeTab, setActiveTab] = useState<"clubs"|"dm">("clubs");
  const [selectedLocalClub, setSelectedLocalClub] = useState<Club | null>(null);
  const [directMessageUser, setDirectMessageUser] = useState<DMUser | null>(null);
  
  const { sendMessageToClub, deleteMessage } = useChatActions();
  const { currentUser } = useApp();
  const { fetchConversations, getOrCreateConversation } = useDirectConversationsContext();
  const { markConversationAsRead } = useUnreadMessages();

  // Effect to fetch conversations when drawer opens
  useEffect(() => {
    if (open && currentUser?.id) {
      // Only fetch if we're on the DM tab
      if (activeTab === "dm") {
        console.log("[useMainChatDrawer] Drawer opened with DM tab, ensuring conversations are loaded");
        fetchConversations();
      }
    }
  }, [open, currentUser?.id, activeTab, fetchConversations]);
  
  // Handle direct message opening events
  useEffect(() => {
    const handleOpenDM = async (event: CustomEvent<{
      userId: string;
      userName: string;
      userAvatar?: string;
      conversationId?: string;
    }>) => {
      setActiveTab("dm");
      
      // If conversationId is not provided, we'll need to fetch/create it
      if (!event.detail.conversationId && currentUser?.id) {
        console.log("[useMainChatDrawer] Creating/fetching conversation for user:", event.detail.userName);
        
        try {
          const conversation = await getOrCreateConversation(
            event.detail.userId,
            event.detail.userName,
            event.detail.userAvatar || '/placeholder.svg'
          );
          
          if (conversation) {
            setDirectMessageUser({
              userId: event.detail.userId,
              userName: event.detail.userName,
              userAvatar: event.detail.userAvatar || '/placeholder.svg',
              conversationId: conversation.conversationId
            });
            
            // Mark as read if opening a conversation
            if (conversation.conversationId !== 'new') {
              markConversationAsRead(conversation.conversationId);
            }
          }
        } catch (error) {
          console.error("[useMainChatDrawer] Error creating conversation:", error);
        }
      } else {
        setDirectMessageUser({
          userId: event.detail.userId,
          userName: event.detail.userName,
          userAvatar: event.detail.userAvatar || '/placeholder.svg',
          conversationId: event.detail.conversationId || 'new'
        });
        
        // Mark as read if opening with a valid conversation ID
        if (event.detail.conversationId) {
          markConversationAsRead(event.detail.conversationId);
        }
      }
    };

    window.addEventListener('openDirectMessage', handleOpenDM as EventListener);
    return () => {
      window.removeEventListener('openDirectMessage', handleOpenDM as EventListener);
    };
  }, [currentUser?.id, getOrCreateConversation, markConversationAsRead]);

  const handleSelectClub = (club: Club) => {
    setSelectedLocalClub(club);
    
    // Dispatch event to notify that a club has been selected (for read status)
    window.dispatchEvent(new CustomEvent('clubSelected', {
      detail: { clubId: club.id }
    }));
  };

  const handleSendMessage = async (message: string, clubId?: string) => {
    if (message && clubId) {
      console.log('[useMainChatDrawer] Sending message to club:', clubId);
      return await sendMessageToClub(clubId, message);
    }
  };
  
  const handleDeleteMessage = async (messageId: string) => {
    if (messageId) {
      console.log('[useMainChatDrawer] Deleting message:', messageId);
      return await deleteMessage(messageId);
    }
  };
  
  const handleTabChange = (tab: "clubs" | "dm") => {
    setActiveTab(tab);
    
    // If changing to DM tab and not already loaded, load conversations
    if (tab === "dm" && currentUser?.id) {
      fetchConversations();
    }
    
    // If changing away from a selected club, dispatch event
    if (tab !== "clubs" && selectedLocalClub) {
      window.dispatchEvent(new CustomEvent('clubDeselected'));
    }
  };

  return {
    activeTab,
    selectedLocalClub,
    directMessageUser,
    handleSelectClub,
    handleTabChange,
    handleSendMessage,
    handleDeleteMessage,
    setDirectMessageUser
  };
};
