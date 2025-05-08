
import React, { useState, useEffect } from 'react';
import { Send } from 'lucide-react';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  isSending?: boolean;
  placeholder?: string;
  clubId?: string; // Used for chat context tracking
  conversationId?: string; // Unified ID for any conversation (club, dm, support)
  conversationType?: 'club' | 'dm' | 'support'; // Type of conversation
}

const ChatInput: React.FC<ChatInputProps> = ({ 
  onSendMessage, 
  isSending = false,
  placeholder = "Type a message...",
  clubId,
  conversationId,
  conversationType = 'club'
}) => {
  const [message, setMessage] = useState('');
  const contextId = conversationId || clubId || 'unknown';
  
  useEffect(() => {
    console.log(`[ChatInput] Reset input for ${conversationType} conversation: ${contextId}`);
    setMessage('');
  }, [contextId, conversationType]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (message.trim() && !isSending) {
      const messageToSend = message.trim();
      console.log(`[ChatInput] Submitting message for ${conversationType}:${contextId}:`, 
        messageToSend.substring(0, 20));
      
      // Clear the input immediately for better user experience
      setMessage('');
      
      try {
        await onSendMessage(messageToSend);
      } catch (error) {
        console.error(`[ChatInput] Error sending message for ${conversationType}:${contextId}:`, error);
        // If there was an error, restore the message
        setMessage(messageToSend);
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };
  
  return (
    <form 
      onSubmit={handleSubmit}
      className="h-16 min-h-[64px] p-3 flex items-center gap-2 w-full bg-white border-t z-10"
      data-conversation-type={conversationType}
      data-conversation-id={contextId}
    >
      <input
        type="text"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyPress={handleKeyPress}
        placeholder={placeholder}
        className="flex-1 border rounded-full py-2 px-4 focus:outline-none focus:ring-1 focus:ring-primary"
        disabled={isSending}
      />
      <button 
        type="submit"
        className="p-2 rounded-full bg-primary text-white flex items-center justify-center disabled:opacity-50 flex-shrink-0 transition-opacity duration-150"
        disabled={!message.trim() || isSending}
      >
        {isSending ? (
          <span className="animate-pulse">...</span>
        ) : (
          <Send className="h-5 w-5" />
        )}
      </button>
    </form>
  );
};

export default React.memo(ChatInput);
