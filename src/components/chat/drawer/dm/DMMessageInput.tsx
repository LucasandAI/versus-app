
import React from 'react';
import ChatInput from '../../ChatInput';

interface DMMessageInputProps {
  onSendMessage: (message: string) => void;
  isSending: boolean;
  userId: string;
  conversationId: string;
}

const DMMessageInput: React.FC<DMMessageInputProps> = ({
  onSendMessage,
  isSending,
  userId,
  conversationId
}) => {
  return (
    <div className="bg-white">
      <ChatInput 
        onSendMessage={onSendMessage}
        isSending={isSending}
        clubId={userId}
        conversationId={conversationId}
        conversationType="dm"
      />
    </div>
  );
};

export default DMMessageInput;
