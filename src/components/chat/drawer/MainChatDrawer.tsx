
import React, { useState, useCallback } from 'react';
import { Club } from '@/types';
import DrawerHeader from './DrawerHeader';
import ChatClubContainer from './club/ChatClubContainer';
import DMContainer from './dm/DMContainer';
import { ClubMessage, DirectMessage } from '@/context/ChatContext';

interface MainChatDrawerProps {
  clubs: Club[];
  clubMessages: Record<string, ClubMessage[]>;
  directMessages: Record<string, DirectMessage[]>;
  selectedClub: Club | null;
  setSelectedClub: (club: Club | null) => void;
  selectedConversation: { id: string; user: { id: string; name: string; avatar?: string; } } | null;
  setSelectedConversation: (conversation: { id: string; user: { id: string; name: string; avatar?: string; } } | null) => void;
  onSendMessage: (message: string, clubId?: string) => void;
  onSendDirectMessage: (message: string, conversationId: string, receiverId: string) => Promise<void>;
  onDeleteMessage?: (messageId: string, type: 'club' | 'direct', contextId: string) => void;
  unreadClubs: Set<string>;
  unreadConversations: Set<string>;
  markClubAsRead: (clubId: string) => void;
  markConversationAsRead: (conversationId: string) => void;
  onSelectUser: (userId: string, userName: string, userAvatar?: string) => void;
}

const MainChatDrawer: React.FC<MainChatDrawerProps> = ({
  clubs,
  clubMessages,
  directMessages,
  selectedClub,
  setSelectedClub,
  selectedConversation,
  setSelectedConversation,
  onSendMessage,
  onSendDirectMessage,
  onDeleteMessage,
  unreadClubs,
  unreadConversations,
  markClubAsRead,
  markConversationAsRead,
  onSelectUser
}) => {
  const [activeTab, setActiveTab] = useState<"clubs"|"dm">("clubs");
  
  const handleSelectClub = useCallback((club: Club) => {
    setSelectedClub(club);
    setSelectedConversation(null);
    
    // Mark club messages as read
    markClubAsRead(club.id);
    
    // Fire an event to notify other components
    window.dispatchEvent(new CustomEvent('clubSelected', { detail: { clubId: club.id } }));
  }, [setSelectedClub, setSelectedConversation, markClubAsRead]);
  
  const handleSelectConversation = useCallback((conversation: { 
    id: string; 
    user: { id: string; name: string; avatar?: string; } 
  }) => {
    setSelectedConversation(conversation);
    setSelectedClub(null);
    
    // Mark conversation as read if it's not 'new'
    if (conversation.id !== 'new') {
      markConversationAsRead(conversation.id);
    }
  }, [setSelectedConversation, setSelectedClub, markConversationAsRead]);
  
  const handleTabChange = useCallback((tab: "clubs" | "dm") => {
    setActiveTab(tab);
    
    // Clear selections when changing tabs
    if (tab === "clubs") {
      setSelectedConversation(null);
    } else {
      setSelectedClub(null);
    }
  }, [setSelectedClub, setSelectedConversation]);

  return (
    <>
      <DrawerHeader 
        activeTab={activeTab} 
        setActiveTab={handleTabChange}
        selectedClub={selectedClub}
        selectedConversation={selectedConversation}
      />
      
      <div className="flex-1 overflow-hidden">
        {activeTab === 'clubs' ? (
          <ChatClubContainer 
            clubs={clubs}
            selectedClub={selectedClub}
            onSelectClub={handleSelectClub}
            clubMessages={clubMessages}
            unreadClubs={unreadClubs}
            onSendMessage={onSendMessage}
            onDeleteMessage={onDeleteMessage}
            onSelectUser={onSelectUser}
          />
        ) : (
          <DMContainer
            directMessages={directMessages}
            selectedConversation={selectedConversation}
            setSelectedConversation={handleSelectConversation}
            unreadConversations={unreadConversations}
            onSendDirectMessage={onSendDirectMessage}
            onDeleteMessage={onDeleteMessage}
            onSelectUser={onSelectUser}
          />
        )}
      </div>
    </>
  );
};

export default React.memo(MainChatDrawer);
