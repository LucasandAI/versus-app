import React, { useState, useEffect } from 'react';
import ChatHeader from './ChatHeader';
import ChatMessages from './ChatMessages';
import ChatInput from './ChatInput';
import { Club } from '@/types';

interface ChatClubContentProps {
  club: Club;
  messages: any[];
  onMatchClick?: () => void;
  onSelectUser: (userId: string, userName: string, userAvatar?: string) => void;
  onSendMessage: (message: string, clubId?: string) => void; 
  onDeleteMessage?: (messageId: string) => void;
}

const ChatClubContent: React.FC<ChatClubContentProps> = ({
  club,
  messages,
  onMatchClick,
  onSelectUser,
  onSendMessage,
  onDeleteMessage
}) => {
  // You can add any state or useEffect hooks here if needed
  
  // Update the ChatHeader usage to match the expected props
  return (
    <div className="flex flex-col h-full">
      <ChatHeader
        club={club}
        onMatchClick={onMatchClick || (() => {})}
        onSelectUser={onSelectUser}
        onClubClick={() => {}} // Add default empty handler
      />
      <ChatMessages messages={messages} onDeleteMessage={onDeleteMessage} onUserClick={(userId, userName) => onSelectUser(userId, userName)} />
      <ChatInput onSendMessage={(message) => onSendMessage(message, club.id)} />
    </div>
  );
};

export default ChatClubContent;
