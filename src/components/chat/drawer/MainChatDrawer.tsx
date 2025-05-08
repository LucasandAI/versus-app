
import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  // Use refs for mutable state to avoid re-renders
  const [activeTab, setActiveTab] = useState<"clubs"|"dm">("clubs");
  const [selectedLocalClub, setSelectedLocalClub] = useState<Club | null>(null);
  const [directMessageUser, setDirectMessageUser] = useState<{
    userId: string;
    userName: string;
    userAvatar: string;
    conversationId: string;
  } | null>(null);
  
  // Store unread sets in refs to avoid re-renders, using memoized copies for rendering
  const { unreadClubs, unreadConversations } = useUnreadMessages();
  const unreadClubsRef = useRef<Set<string>>(new Set());
  const unreadConversationsRef = useRef<Set<string>>(new Set());
  
  // Update refs without causing re-renders
  useEffect(() => {
    unreadClubsRef.current = new Set(unreadClubs);
  }, [unreadClubs]);
  
  useEffect(() => {
    unreadConversationsRef.current = new Set(unreadConversations);
  }, [unreadConversations]);
  
  // Stable action handlers
  const { sendMessageToClub, deleteMessage } = useChatActions();
  const { currentUser } = useApp();
  const { fetchConversations } = useDirectConversationsContext();

  // Memoized handler functions
  const handleSelectClub = useCallback((club: Club) => {
    setSelectedLocalClub(club);
  }, []);

  const handleSendMessage = useCallback(async (message: string, clubId?: string) => {
    if (message && clubId && setClubMessages) {
      console.log('[MainChatDrawer] Sending message to club:', clubId);
      return await sendMessageToClub(clubId, message, setClubMessages);
    }
  }, [sendMessageToClub, setClubMessages]);
  
  const handleDeleteMessage = useCallback(async (messageId: string) => {
    if (messageId && setClubMessages) {
      console.log('[MainChatDrawer] Deleting message:', messageId);
      return await deleteMessage(messageId, setClubMessages);
    }
  }, [deleteMessage, setClubMessages]);
  
  const handleTabChange = useCallback((tab: "clubs" | "dm") => {
    setActiveTab(tab);
  }, []);

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
  
  // Handle direct message opening events
  useEffect(() => {
    const handleOpenDM = (event: CustomEvent<{
      userId: string;
      userName: string;
      userAvatar?: string;
      conversationId?: string;
    }>) => {
      setActiveTab("dm");
      
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

  // IMPORTANT: Use React.memo for stable child rendering
  const DrawerHeaderMemo = React.memo(DrawerHeader);
  const ChatDrawerContainerMemo = React.memo(ChatDrawerContainer);

  return (
    <ChatProvider>
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="h-[80vh] rounded-t-xl p-0 flex flex-col">
          <DrawerHeaderMemo 
            activeTab={activeTab} 
            setActiveTab={handleTabChange}
            selectedClub={selectedLocalClub}
          />
          
          <ChatDrawerContainerMemo 
            activeTab={activeTab}
            clubs={clubs}
            selectedLocalClub={selectedLocalClub}
            onSelectClub={handleSelectClub}
            messages={clubMessages}
            deleteChat={() => {}}
            unreadMessages={{}}
            unreadClubs={unreadClubsRef.current}
            unreadConversations={unreadConversationsRef.current}
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

// Use React.memo for the entire component
export default React.memo(MainChatDrawer);
