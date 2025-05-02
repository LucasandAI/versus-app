
import React, { useState, useEffect } from 'react';
import { Club } from '@/types';
import ChatDrawerContainer from './ChatDrawerContainer';
import DrawerHeader from './DrawerHeader';
import { ChatProvider } from '@/context/ChatContext';
import { Drawer, DrawerContent } from '@/components/ui/drawer';
import { useChatActions } from '@/hooks/chat/useChatActions';
import { useApp } from '@/context/AppContext';
import { useDirectConversationsContext } from '@/context/DirectConversationsContext';
import { useUnreadMessages } from '@/context/unread-messages';

interface MainChatDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clubs: Club[];
  onNewMessage?: (count: number) => void;
  clubMessages?: Record<string, any[]>;
  setClubMessages?: React.Dispatch<React.SetStateAction<Record<string, any[]>>>;
}

const MainChatDrawer: React.FC<MainChatDrawerProps> = ({
  open,
  onOpenChange,
  clubs,
  onNewMessage,
  clubMessages = {},
  setClubMessages
}) => {
  const [activeTab, setActiveTab] = useState<"clubs"|"dm">("clubs");
  const [selectedLocalClub, setSelectedLocalClub] = useState<Club | null>(null);
  const [directMessageUser, setDirectMessageUser] = useState<{
    userId: string;
    userName: string;
    userAvatar: string;
    conversationId: string;
  } | null>(null);
  
  // Add a local copy of unreadClubs for direct passing and forced re-renders
  const { unreadClubs, unreadConversations } = useUnreadMessages();
  const [localUnreadClubs, setLocalUnreadClubs] = useState<Set<string>>(new Set());
  const [localUnreadConversations, setLocalUnreadConversations] = useState<Set<string>>(new Set());
  const [forceUpdateKey, setForceUpdateKey] = useState(Date.now());
  
  // Force re-render when unreadClubs changes
  useEffect(() => {
    setLocalUnreadClubs(new Set(unreadClubs));
    setForceUpdateKey(Date.now());
  }, [unreadClubs]);

  // Force re-render when unreadConversations changes
  useEffect(() => {
    setLocalUnreadConversations(new Set(unreadConversations));
  }, [unreadConversations]);
  
  // Listen for global unread message events
  useEffect(() => {
    const handleUnreadMessagesUpdate = () => {
      console.log('[MainChatDrawer] Detected unreadMessagesUpdated event, forcing re-render');
      setForceUpdateKey(Date.now());
    };
    
    window.addEventListener('unreadMessagesUpdated', handleUnreadMessagesUpdate);
    return () => {
      window.removeEventListener('unreadMessagesUpdated', handleUnreadMessagesUpdate);
    };
  }, []);
  
  const { sendClubMessage, deleteMessage } = useChatActions();
  const { currentUser } = useApp();
  
  // Access conversations from context
  const { fetchConversations } = useDirectConversationsContext();

  // Effect to fetch conversations when drawer opens
  useEffect(() => {
    if (open && currentUser?.id) {
      // Only fetch if we're on the DM tab
      if (activeTab === "dm") {
        console.log("[MainChatDrawer] Drawer opened with DM tab, ensuring conversations are loaded");
        fetchConversations();
      }
    }
  }, [open, currentUser?.id, activeTab, fetchConversations]);
  
  useEffect(() => {
    const handleOpenDM = (event: CustomEvent<{
      userId: string;
      userName: string;
      userAvatar?: string;
      conversationId?: string;
    }>) => {
      setActiveTab("dm");
      
      // If conversationId is not provided, we'll need to fetch/create it
      if (!event.detail.conversationId) {
        console.log("[MainChatDrawer] Opening DM with user:", event.detail.userName);
      }
      
      setDirectMessageUser({
        userId: event.detail.userId,
        userName: event.detail.userName,
        userAvatar: event.detail.userAvatar || '/placeholder.svg',
        conversationId: event.detail.conversationId || 'new'
      });
    };

    window.addEventListener('openDirectMessage', handleOpenDM as EventListener);
    return () => {
      window.removeEventListener('openDirectMessage', handleOpenDM as EventListener);
    };
  }, [fetchConversations]);

  const handleSelectClub = (club: Club) => {
    setSelectedLocalClub(club);
  };

  const handleSendMessage = async (message: string, clubId?: string) => {
    if (message && clubId && setClubMessages) {
      console.log('[MainChatDrawer] Sending message to club:', clubId);
      return await sendClubMessage(message, clubId);
    }
  };
  
  const handleDeleteMessage = async (messageId: string) => {
    if (messageId && setClubMessages) {
      console.log('[MainChatDrawer] Deleting message:', messageId);
      return await deleteMessage(messageId, setClubMessages);
    }
  };
  
  const handleTabChange = (tab: "clubs" | "dm") => {
    setActiveTab(tab);
  };

  return (
    <ChatProvider>
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="h-[80vh] rounded-t-xl p-0 flex flex-col">
          <DrawerHeader 
            activeTab={activeTab} 
            setActiveTab={handleTabChange}
            selectedClub={selectedLocalClub}
          />
          
          <ChatDrawerContainer 
            key={`drawer-container-${forceUpdateKey}`}
            activeTab={activeTab}
            clubs={clubs}
            selectedLocalClub={selectedLocalClub}
            onSelectClub={handleSelectClub}
            messages={clubMessages}
            deleteChat={() => {}}
            unreadMessages={{}}
            unreadClubs={localUnreadClubs}
            unreadConversations={localUnreadConversations}
            handleNewMessage={() => {}}
            onSendMessage={handleSendMessage}
            onDeleteMessage={handleDeleteMessage}
            directMessageUser={directMessageUser}
            setDirectMessageUser={setDirectMessageUser}
          />
        </DrawerContent>
      </Drawer>
    </ChatProvider>
  );
};

export default MainChatDrawer;
