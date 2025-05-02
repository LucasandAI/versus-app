
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
  // Add the new props here as well
  activeClubId?: string | null;
  setActiveClubId?: (clubId: string | null) => void;
  activeClubMessages?: any[];
}

const MainChatDrawer: React.FC<MainChatDrawerProps> = ({
  open,
  onOpenChange,
  clubs,
  onNewMessage,
  clubMessages = {},
  setClubMessages,
  // Destructure the new props
  activeClubId,
  setActiveClubId,
  activeClubMessages
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
  
  // NEW EFFECT: Sync activeClubId with selectedLocalClub
  useEffect(() => {
    if (activeClubId && clubs && clubs.length > 0) {
      console.log(`[MainChatDrawer] Syncing activeClubId: ${activeClubId} with selectedLocalClub`);
      
      // Find the matching club object
      const matchingClub = clubs.find(club => club.id === activeClubId);
      
      if (matchingClub) {
        console.log(`[MainChatDrawer] Found matching club: ${matchingClub.name}`);
        setSelectedLocalClub(matchingClub);
      } else {
        console.log(`[MainChatDrawer] No matching club found for activeClubId: ${activeClubId}`);
      }
    }
  }, [activeClubId, clubs]);
  
  const { sendMessageToClub, deleteMessage } = useChatActions();
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
    
    // Sync the selection with activeClubId
    if (setActiveClubId && club) {
      console.log(`[MainChatDrawer] Setting activeClubId to: ${club.id} from handleSelectClub`);
      setActiveClubId(club.id);
    }
  };

  const handleSendMessage = async (message: string, clubId?: string) => {
    if (message && clubId && setClubMessages) {
      console.log('[MainChatDrawer] Sending message to club:', clubId);
      return await sendMessageToClub(clubId, message, setClubMessages);
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
            // Pass the new props to ChatDrawerContainer
            activeClubId={activeClubId}
            setActiveClubId={setActiveClubId}
            activeClubMessages={activeClubMessages}
          />
        </DrawerContent>
      </Drawer>
    </ChatProvider>
  );
};

export default MainChatDrawer;
