
import React, { useState } from 'react';
import { Send } from 'lucide-react';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  isSending?: boolean;
}

const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, isSending = false }) => {
  const [message, setMessage] = useState('');
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !isSending) {
      await onSendMessage(message);
      setMessage('');
    }
  };
  
  return (
    <form 
      onSubmit={handleSubmit}
      className="border-t p-3 flex items-center"
    >
      <input
        type="text"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Type a message..."
        className="flex-1 border rounded-full py-2 px-4 focus:outline-none focus:ring-1 focus:ring-primary"
        disabled={isSending}
      />
      <button 
        type="submit"
        className="ml-2 p-2 rounded-full bg-primary text-white flex items-center justify-center"
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
