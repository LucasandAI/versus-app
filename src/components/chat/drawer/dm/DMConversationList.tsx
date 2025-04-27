
import React, { useEffect } from 'react';
import { useHiddenDMs } from '@/hooks/chat/useHiddenDMs';
import ConversationItem from './ConversationItem';
import { useConversations } from '@/hooks/chat/dm/useConversations';
import { useIsMobile } from '@/hooks/use-mobile';
import AppHeader from '@/components/shared/AppHeader';

interface Props {
  onSelectUser: (userId: string, userName: string, userAvatar?: string) => void;
  selectedUserId?: string;
}

const DMConversationList: React.FC<Props> = ({ onSelectUser, selectedUserId }) => {
  const { hideConversation, hiddenDMs } = useHiddenDMs();
  const { conversations } = useConversations(hiddenDMs);
  const isMobile = useIsMobile();
  
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
    <div className="flex flex-col h-full">
      <AppHeader title="Messages" />
      
      <div className="flex-1 overflow-auto">
        <div className="space-y-1 p-3">
          {conversations.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No messages yet</p>
              <p className="text-sm mt-1">Start a conversation by searching for users</p>
            </div>
          ) : (
            conversations.map((conversation) => (
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
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default DMConversationList;
