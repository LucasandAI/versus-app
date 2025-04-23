
import React, { useState } from 'react';
import { Send } from 'lucide-react';
import { useApp } from '@/context/AppContext';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
}

const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage }) => {
  const [message, setMessage] = useState('');
  const { currentUser } = useApp();
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && currentUser?.id) {
      console.log('Sending message as user ID:', currentUser.id);
      onSendMessage(message);
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
      />
      <button 
        type="submit"
        className="ml-2 p-2 rounded-full bg-primary text-white flex items-center justify-center"
        disabled={!message.trim() || !currentUser?.id}
      >
        <Send className="h-5 w-5" />
      </button>
    </form>
  );
};

export default ChatInput;
