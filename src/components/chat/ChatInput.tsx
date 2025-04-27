
import React, { useState, useEffect } from 'react';
import { Send } from 'lucide-react';

interface ChatInputProps {
  onSendMessage?: (message: string) => void;
  value?: string;
  onChange?: (value: string) => void;
  isSending?: boolean;
  placeholder?: string;
  clubId?: string; // Used for chat context tracking
  conversationId?: string; // Unified ID for any conversation (club, dm, support)
  conversationType?: 'club' | 'dm' | 'support'; // Type of conversation
  disabled?: boolean;
}

const ChatInput: React.FC<ChatInputProps> = ({ 
  onSendMessage, 
  value,
  onChange,
  isSending = false,
  placeholder = "Type a message...",
  clubId,
  conversationId,
  conversationType = 'club',
  disabled = false
}) => {
  const [internalMessage, setInternalMessage] = useState('');
  const contextId = conversationId || clubId || 'unknown';
  
  // Use either controlled or uncontrolled input based on whether value/onChange are provided
  const isControlled = value !== undefined && onChange !== undefined;
  const message = isControlled ? value : internalMessage;
  
  useEffect(() => {
    if (!isControlled) {
      console.log(`[ChatInput] Reset input for ${conversationType} conversation: ${contextId}`);
      setInternalMessage('');
    }
  }, [contextId, conversationType, isControlled]);
  
  const handleMessageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isControlled) {
      onChange?.(e.target.value);
    } else {
      setInternalMessage(e.target.value);
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (message.trim() && !isSending && !disabled) {
      const messageToSend = message.trim();
      console.log(`[ChatInput] Submitting message for ${conversationType}:${contextId}:`, 
        messageToSend.substring(0, 20));
      
      if (isControlled) {
        onChange?.('');
      } else {
        setInternalMessage('');
      }
      
      try {
        if (onSendMessage) {
          await onSendMessage(messageToSend);
        }
      } catch (error) {
        console.error(`[ChatInput] Error sending message for ${conversationType}:${contextId}:`, error);
        if (isControlled) {
          onChange?.(messageToSend);
        } else {
          setInternalMessage(messageToSend);
        }
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
        onChange={handleMessageChange}
        onKeyPress={handleKeyPress}
        placeholder={placeholder}
        className="flex-1 border rounded-full py-2 px-4 focus:outline-none focus:ring-1 focus:ring-primary"
        disabled={isSending || disabled}
      />
      <button 
        type="submit"
        className="p-2 rounded-full bg-primary text-white flex items-center justify-center disabled:opacity-50 flex-shrink-0"
        disabled={!message.trim() || isSending || disabled}
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

export default ChatInput;
