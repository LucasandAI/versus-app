
import React, { useState, useEffect, useRef } from 'react';
import { Club } from '@/types';
import ChatDrawerContainer from './ChatDrawerContainer';
import DrawerHeader from './DrawerHeader';
import { ChatProvider } from '@/context/ChatContext';
import { Drawer, DrawerContent } from '@/components/ui/drawer';
import { useChatActions } from '@/hooks/chat/useChatActions';
import { useApp } from '@/context/AppContext';
import { useConversations } from '@/hooks/chat/dm/useConversations';

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
  
  const { sendMessageToClub, deleteMessage } = useChatActions();
  const { currentUser, isSessionReady } = useApp();
  
  // Get conversations hook but don't fetch on mount
  const { fetchConversations, resetFetchState } = useConversations([]);
  const fetchAttemptedRef = useRef(false);
  
  // Only fetch conversations when drawer is opened AND we're on DM tab
  useEffect(() => {
    // Skip if session or user isn't ready
    if (!isSessionReady || !currentUser?.id) {
      console.log('[MainChatDrawer] Session or user not ready, skipping fetch');
      return;
    }
    
    // Only fetch when drawer is open AND we're on the DM tab
    if (open && activeTab === "dm" && !fetchAttemptedRef.current) {
      console.log('[MainChatDrawer] Drawer open, on DM tab, fetching conversations');
      fetchAttemptedRef.current = true; // Mark that we've attempted a fetch
      
      // Add a small delay to ensure all conditions are stable
      setTimeout(() => {
        fetchConversations();
      }, 300);
    }
    
    // When drawer closes, reset fetch state so we can fetch fresh data next time
    if (!open && fetchAttemptedRef.current) {
      console.log('[MainChatDrawer] Drawer closed, resetting fetch state');
      fetchAttemptedRef.current = false;
      resetFetchState();
    }
  }, [open, activeTab, isSessionReady, currentUser?.id, fetchConversations, resetFetchState]);

  // Handle direct message open event from other components
  useEffect(() => {
    const handleOpenDM = (event: CustomEvent<{
      userId: string;
      userName: string;
      userAvatar?: string;
      conversationId: string;
    }>) => {
      // When a DM is requested, set the tab to DM and set user info
      setActiveTab("dm");
      setDirectMessageUser({
        userId: event.detail.userId,
        userName: event.detail.userName,
        userAvatar: event.detail.userAvatar || '/placeholder.svg',
        conversationId: event.detail.conversationId
      });
      
      // Fetch conversations if we haven't already
      if (!fetchAttemptedRef.current && isSessionReady && currentUser?.id) {
        console.log('[MainChatDrawer] DM requested, fetching conversations');
        fetchAttemptedRef.current = true;
        fetchConversations();
      }
    };

    window.addEventListener('openDirectMessage', handleOpenDM as EventListener);
    return () => {
      window.removeEventListener('openDirectMessage', handleOpenDM as EventListener);
    };
  }, [isSessionReady, currentUser?.id, fetchConversations]);

  const handleSelectClub = (club: Club) => {
    setSelectedLocalClub(club);
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
    
    // Only fetch conversations when switching to DM tab AND we haven't fetched yet
    // AND we have both session and user
    if (tab === "dm" && !fetchAttemptedRef.current && isSessionReady && currentUser?.id) {
      console.log('[MainChatDrawer] Switching to DM tab, fetching conversations');
      fetchAttemptedRef.current = true;
      fetchConversations();
    }
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
            activeTab={activeTab}
            clubs={clubs}
            selectedLocalClub={selectedLocalClub}
            onSelectClub={handleSelectClub}
            messages={clubMessages}
            deleteChat={() => {}}
            unreadMessages={{}}
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
