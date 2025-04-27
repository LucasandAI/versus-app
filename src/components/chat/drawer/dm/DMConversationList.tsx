
import React, { useEffect } from 'react';
import { useHiddenDMs } from '@/hooks/chat/useHiddenDMs';
import ConversationItem from './ConversationItem';
import { useConversations } from '@/hooks/chat/dm/useConversations';

interface Props {
  onSelectUser: (userId: string, userName: string, userAvatar?: string) => void;
  selectedUserId?: string;
}

const DMConversationList: React.FC<Props> = ({ onSelectUser, selectedUserId }) => {
  const { hideConversation, isConversationHidden, hiddenDMs } = useHiddenDMs();
  const { conversations, refreshVersion } = useConversations(hiddenDMs);

  useEffect(() => {
    // Debug log for conversation refreshes
    console.log('[DMConversationList] Conversation list refreshed', { 
      refreshVersion, 
      conversationsCount: conversations.length
    });
  }, [refreshVersion, conversations.length]);

  // Debug log for rendering with the current conversation list
  console.log('[DMConversationList] Rendering conversations:', 
    conversations.map(conv => ({
      userId: conv.userId,
      userName: conv.userName,
      lastMessage: conv.lastMessage,
      timestamp: conv.timestamp
    }))
  );

  const handleHideConversation = (
    e: React.MouseEvent,
    userId: string
  ) => {
    e.stopPropagation();
    console.log('[DMConversationList] Hiding conversation for user:', userId);
    hideConversation(userId);
  };

  const visibleConversations = conversations.filter(
    conv => !isConversationHidden(conv.userId)
  );

  return (
    <div className="flex flex-col space-y-2 p-4">
      <h2 className="font-semibold text-lg mb-2">Messages</h2>
      {visibleConversations.map((conversation) => (
        <ConversationItem
          key={conversation.userId}
          conversation={conversation}
          isSelected={selectedUserId === conversation.userId}
          onSelect={() => onSelectUser(
            conversation.userId,
            conversation.userName,
            conversation.userAvatar
          )}
          onHide={(e) => handleHideConversation(e, conversation.userId)}
        />
      ))}
      {visibleConversations.length === 0 && (
        <p className="text-center text-gray-500 py-4">No conversations yet</p>
      )}
    </div>
  );
};

export default DMConversationList;
