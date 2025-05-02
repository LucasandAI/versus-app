
import React, { useState, useEffect } from 'react';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import ChatDrawerHeader from './ChatDrawerHeader';
import ChatDrawerContainer from './ChatDrawerContainer';
import ChatDrawerTabs from './ChatDrawerTabs';
import { Club } from '@/types';
import { useChatInteractions } from '@/hooks/chat/useChatInteractions';
import { useActiveClubMessages } from '@/hooks/chat/useActiveClubMessages';
import { toast } from '@/hooks/use-toast';

interface MainChatDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clubs: Club[];
  unreadMessages?: Record<string, number>;
  unreadClubs?: Set<string>;
  unreadConversations?: Set<string>;
  messages?: Record<string, any[]>;
  setClubMessages?: React.Dispatch<React.SetStateAction<Record<string, any[]>>>;
  onNewMessage?: (count: number) => void;
  onSendMessage?: (message: string, clubId?: string) => Promise<void> | void;
  onDeleteMessage?: (messageId: string) => void;
}

const MainChatDrawer = ({
  open,
  onOpenChange,
  clubs = [],
  unreadMessages = {},
  unreadClubs = new Set(),
  unreadConversations = new Set(),
  messages = {},
  setClubMessages,
  onNewMessage,
  onSendMessage,
  onDeleteMessage
}: MainChatDrawerProps) => {
  const [activeTab, setActiveTab] = useState<'clubs' | 'dm'>('clubs');
  const [selectedLocalClub, setSelectedLocalClub] = useState<Club | null>(null);
  const [activeClubId, setActiveClubId] = useState<string | null>(null);
  const [directMessageUser, setDirectMessageUser] = useState<{
    userId: string;
    userName: string;
    userAvatar: string;
    conversationId: string;
  } | null>(null);
  
  // Use the hook to get active club messages
  const { 
    messages: activeClubMessages, 
    addMessage: addActiveClubMessage,
    deleteMessage: deleteActiveClubMessage 
  } = useActiveClubMessages(activeClubId);
  
  // Load chat interactions
  const {
    handleNewMessage,
    deleteChat,
    unreadMessages: localUnreadMessages
  } = useChatInteractions();
  
  // Sync activeClubId with selectedLocalClub
  useEffect(() => {
    if (selectedLocalClub?.id && selectedLocalClub.id !== activeClubId) {
      console.log(`[MainChatDrawer] Setting active club ID from selection: ${selectedLocalClub.id}`);
      setActiveClubId(selectedLocalClub.id);
    } else if (!selectedLocalClub && activeClubId) {
      console.log('[MainChatDrawer] Clearing active club ID as no club selected');
      setActiveClubId(null);
    }
  }, [selectedLocalClub, activeClubId]);
  
  // Sync selectedLocalClub with activeClubId
  useEffect(() => {
    if (activeClubId && (!selectedLocalClub || selectedLocalClub.id !== activeClubId)) {
      console.log(`[MainChatDrawer] Finding club for active club ID: ${activeClubId}`);
      const matchingClub = clubs.find(club => club.id === activeClubId);
      if (matchingClub) {
        console.log(`[MainChatDrawer] Found matching club: ${matchingClub.name}`);
        setSelectedLocalClub(matchingClub);
      }
    }
  }, [activeClubId, clubs, selectedLocalClub]);
  
  // Listen for events to set active club
  useEffect(() => {
    const handleClubSelected = (e: CustomEvent) => {
      if (e.detail?.clubId) {
        const clubId = e.detail.clubId;
        console.log(`[MainChatDrawer] clubSelected event received: ${clubId}`);
        const matchingClub = clubs.find(club => club.id === clubId);
        if (matchingClub) {
          setSelectedLocalClub(matchingClub);
          setActiveClubId(clubId);
          setActiveTab('clubs');
        }
      }
    };
    
    const handleOpenDirectMessage = (e: CustomEvent) => {
      const { userId, userName, userAvatar } = e.detail;
      console.log(`[MainChatDrawer] openDirectMessage event received: ${userName}`);
      
      if (userId && userName) {
        setDirectMessageUser({
          userId,
          userName,
          userAvatar: userAvatar || '',
          conversationId: 'new' // This will be replaced with actual ID
        });
        setActiveTab('dm');
        setSelectedLocalClub(null);
        setActiveClubId(null);
      }
    };

    window.addEventListener('clubSelected', handleClubSelected as EventListener);
    window.addEventListener('openDirectMessage', handleOpenDirectMessage as EventListener);
    
    return () => {
      window.removeEventListener('clubSelected', handleClubSelected as EventListener);
      window.removeEventListener('openDirectMessage', handleOpenDirectMessage as EventListener);
    };
  }, [clubs]);
  
  // Handle club selection
  const handleSelectClub = (club: Club | null) => {
    console.log('[MainChatDrawer] Club selected:', club?.name || 'none');
    
    if (club !== selectedLocalClub) {
      setSelectedLocalClub(club);
      setActiveClubId(club?.id || null);
      
      if (club?.id) {
        // Dispatch club selected event
        window.dispatchEvent(new CustomEvent('clubSelected', {
          detail: { clubId: club.id }
        }));
      }
    }
  };
  
  // Handle message sending
  const handleSendMessage = async (message: string, clubId?: string) => {
    console.log(`[MainChatDrawer] Send message requested for club ${clubId || 'unknown'}`);
    
    if (!message.trim()) {
      console.log('[MainChatDrawer] Empty message, not sending');
      return;
    }
    
    try {
      // Call the provided onSendMessage function
      if (onSendMessage) {
        await onSendMessage(message, clubId);
        console.log(`[MainChatDrawer] Message sent to club ${clubId || 'unknown'}`);
      }
    } catch (error) {
      console.error('[MainChatDrawer] Error sending message:', error);
      toast({
        title: "Failed to send message",
        description: "Please try again",
        variant: "destructive"
      });
    }
  };
  
  // Handle message deletion
  const handleDeleteMessage = async (messageId: string) => {
    console.log(`[MainChatDrawer] Delete message requested: ${messageId}`);
    
    if (onDeleteMessage) {
      await onDeleteMessage(messageId);
    }
    
    // Also delete from active club messages
    if (activeClubId) {
      deleteActiveClubMessage(messageId);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md p-0 border-l">
        <div className="flex flex-col h-full overflow-hidden">
          <ChatDrawerHeader />
          
          <ChatDrawerTabs 
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            unreadClubs={unreadClubs}
            unreadConversations={unreadConversations}
          />
          
          <ChatDrawerContainer 
            activeTab={activeTab}
            clubs={clubs}
            selectedLocalClub={selectedLocalClub}
            onSelectClub={handleSelectClub}
            messages={messages}
            deleteChat={deleteChat}
            unreadMessages={localUnreadMessages}
            unreadClubs={unreadClubs}
            unreadConversations={unreadConversations}
            handleNewMessage={handleNewMessage}
            onSendMessage={handleSendMessage}
            onDeleteMessage={handleDeleteMessage}
            directMessageUser={directMessageUser}
            setDirectMessageUser={setDirectMessageUser}
            activeClubMessages={activeClubMessages}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default MainChatDrawer;
