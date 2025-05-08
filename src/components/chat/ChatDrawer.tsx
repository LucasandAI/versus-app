
import React from 'react';
import { Club } from '@/types';
import { Drawer, DrawerContent } from '@/components/ui/drawer';
import MainChatDrawer from './drawer/MainChatDrawer';
import { ClubMessage, DirectMessage } from '@/context/ChatContext';

interface ChatDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
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

const ChatDrawer: React.FC<ChatDrawerProps> = ({
  open,
  onOpenChange,
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
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="h-[80vh] rounded-t-xl p-0 flex flex-col">
        <MainChatDrawer 
          clubs={clubs}
          clubMessages={clubMessages}
          directMessages={directMessages}
          selectedClub={selectedClub}
          setSelectedClub={setSelectedClub}
          selectedConversation={selectedConversation}
          setSelectedConversation={setSelectedConversation}
          onSendMessage={onSendMessage}
          onSendDirectMessage={onSendDirectMessage}
          onDeleteMessage={onDeleteMessage}
          unreadClubs={unreadClubs}
          unreadConversations={unreadConversations}
          markClubAsRead={markClubAsRead}
          markConversationAsRead={markConversationAsRead}
          onSelectUser={onSelectUser}
        />
      </DrawerContent>
    </Drawer>
  );
};

export default ChatDrawer;
