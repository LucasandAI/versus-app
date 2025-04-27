
import React from 'react';
import { useHiddenDMs } from '@/hooks/chat/useHiddenDMs';
import ConversationItem from './ConversationItem';
import { useConversations } from '@/hooks/chat/dm/useConversations';

interface Props {
  onSelectUser: (userId: string, userName: string, userAvatar?: string) => void;
  selectedUserId?: string;
}

const DMConversationList: React.FC<Props> = ({ onSelectUser, selectedUserId }) => {
  const { hideConversation, isConversationHidden, hiddenDMs } = useHiddenDMs();
  const { conversations, fetchConversations } = useConversations(hiddenDMs);

  const handleHideConversation = (
    e: React.MouseEvent,
    userId: string
  ) => {
    e.stopPropagation();
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
