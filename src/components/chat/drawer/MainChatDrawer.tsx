
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
  const fetchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const conversationsFetched = useRef(false);
  
  const { fetchConversations } = useConversations([]);
  
  // Fetch conversations when drawer is opened AND session is ready AND user exists
  useEffect(() => {
    // Clean up any existing timeout
    if (fetchTimeoutRef.current) {
      clearTimeout(fetchTimeoutRef.current);
    }
    
    if (open && isSessionReady && currentUser?.id && activeTab === "dm" && !conversationsFetched.current) {
      console.log('[MainChatDrawer] Drawer open, session ready, and user exists - fetching conversations');
      // Use a short timeout to ensure auth is fully ready
      fetchTimeoutRef.current = setTimeout(() => {
        fetchConversations();
        conversationsFetched.current = true;
      }, 500);
    }
    
    return () => {
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current);
      }
    };
  }, [open, isSessionReady, currentUser?.id, fetchConversations, activeTab]);

  useEffect(() => {
    const handleOpenDM = (event: CustomEvent<{
      userId: string;
      userName: string;
      userAvatar?: string;
      conversationId: string;
    }>) => {
      setActiveTab("dm");
      setDirectMessageUser({
        userId: event.detail.userId,
        userName: event.detail.userName,
        userAvatar: event.detail.userAvatar || '/placeholder.svg',
        conversationId: event.detail.conversationId
      });
    };

    window.addEventListener('openDirectMessage', handleOpenDM as EventListener);
    return () => {
      window.removeEventListener('openDirectMessage', handleOpenDM as EventListener);
    };
  }, []);

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
    
    // Only fetch conversations when switching to DM tab AND we have both session and user
    // AND we haven't fetched yet
    if (tab === "dm" && isSessionReady && currentUser?.id && !conversationsFetched.current) {
      console.log('[MainChatDrawer] Switching to DM tab, fetching conversations');
      // Add a small delay to ensure auth is fully ready
      fetchTimeoutRef.current = setTimeout(() => {
        fetchConversations();
        conversationsFetched.current = true;
      }, 300);
    }
  };

  // Reset fetch flag when drawer closes
  useEffect(() => {
    if (!open) {
      conversationsFetched.current = false;
    }
  }, [open]);

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
