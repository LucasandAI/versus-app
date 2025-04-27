
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
  const { conversations } = useConversations(hiddenDMs);
  
  useEffect(() => {
    // Debug log for conversation updates
    console.log('[DMConversationList] Conversations updated:', conversations.length);
  }, [conversations]);

  const handleHideConversation = (
    e: React.MouseEvent,
    userId: string
  ) => {
    e.stopPropagation();
    console.log('[DMConversationList] Hiding conversation for user:', userId);
    hideConversation(userId);
  };

  return (
    <div className="flex flex-col space-y-2 p-4">
      <h2 className="font-semibold text-lg mb-2">Messages</h2>
      {conversations.map((conversation) => (
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
      {conversations.length === 0 && (
        <p className="text-center text-gray-500 py-4">No conversations yet</p>
      )}
    </div>
  );
};

export default DMConversationList;
