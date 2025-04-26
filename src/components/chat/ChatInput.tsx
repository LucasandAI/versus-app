
import React, { useState, useEffect } from 'react';
import { Send } from 'lucide-react';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  isSending?: boolean;
  placeholder?: string;
  clubId?: string; // Add clubId to track conversation context
}

const ChatInput: React.FC<ChatInputProps> = ({ 
  onSendMessage, 
  isSending = false,
  placeholder = "Type a message...",
  clubId
}) => {
  const [message, setMessage] = useState('');
  
  // Reset input when conversation changes (clubId changes)
  useEffect(() => {
    setMessage('');
  }, [clubId]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (message.trim() && !isSending) {
      const messageToSend = message.trim(); // Capture current message in local variable
      console.log('[ChatInput] Submitting message:', messageToSend.substring(0, 20));
      
      // Clear the input immediately to prevent reusing the same message
      setMessage('');
      
      try {
        await onSendMessage(messageToSend);
        // No need to clear again as we already did it before sending
      } catch (error) {
        console.error('[ChatInput] Error sending message:', error);
        // If there's an error, we might want to restore the message
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
      className="p-3 bg-white flex items-center gap-2 w-full"
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
        className="p-2 rounded-full bg-primary text-white flex items-center justify-center disabled:opacity-50 flex-shrink-0"
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

export default ChatInput;
