import React, { useState, useEffect } from 'react';
import { Club } from '@/types';
import ChatDrawerContainer from './ChatDrawerContainer';
import DrawerHeader from './DrawerHeader';
import { ChatProvider } from '@/context/ChatContext';
import { Drawer, DrawerContent } from '@/components/ui/drawer';
import { useChatActions } from '@/hooks/chat/useChatActions';
import { useApp } from '@/context/AppContext';
import { useConversations } from '@/hooks/chat/dm/useConversations';
import { useUnreadMessages } from '@/hooks/chat/dm/useUnreadMessages';
import { useMessageReadStatus } from '@/hooks/chat/useMessageReadStatus';
import { useUnreadCounts } from '@/hooks/chat/useUnreadCounts';
import { supabase } from '@/integrations/supabase/client';

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
  const { currentUser } = useApp();
  const { fetchConversations } = useConversations([]);
  const { markDirectMessagesAsRead, markClubMessagesAsRead } = useMessageReadStatus();
  const { markConversationAsRead } = useUnreadMessages();
  const { markClubAsRead } = useUnreadCounts(currentUser?.id);
  
  useEffect(() => {
    if (open && currentUser?.id) {
      fetchConversations();
    }
  }, [open, currentUser?.id, fetchConversations]);

  useEffect(() => {
    if (onNewMessage && currentUser?.id) {
      // Get total unread counts
      const getUnreadCounts = async () => {
        const { data: dmCount } = await supabase.rpc('get_unread_dm_count', {
          user_id: currentUser.id
        });
        
        const { data: clubCount } = await supabase.rpc('get_unread_club_messages_count', {
          user_id: currentUser.id
        });
        
        onNewMessage((dmCount || 0) + (clubCount || 0));
      };
      
      getUnreadCounts();
    }
  }, [onNewMessage, currentUser?.id]);

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
      
      if (currentUser?.id && event.detail.conversationId !== 'new') {
        // Mark as read in both systems for consistency
        markDirectMessagesAsRead(
          event.detail.conversationId, 
          currentUser.id,
          () => markConversationAsRead(event.detail.conversationId)
        );
      }
    };

    window.addEventListener('openDirectMessage', handleOpenDM as EventListener);
    return () => {
      window.removeEventListener('openDirectMessage', handleOpenDM as EventListener);
    };
  }, [currentUser?.id, markDirectMessagesAsRead, markConversationAsRead]);

  const handleSelectClub = (club: Club) => {
    setSelectedLocalClub(club);
    if (currentUser?.id) {
      markClubMessagesAsRead(
        club.id, 
        currentUser.id,
        () => markClubAsRead(club.id)
      );
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
    
    if (tab === "dm" && currentUser?.id) {
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
