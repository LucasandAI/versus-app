
import React, { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { DirectMessage } from '@/context/ChatContext';

interface DMConversationProps {
  user: {
    id: string;
    name: string;
    avatar: string;
  };
  conversationId: string;
  messages: DirectMessage[];
  onBack: () => void;
  onSendMessage: (message: string) => void;
  onDeleteMessage?: (messageId: string, type: 'club' | 'direct', contextId: string) => void;
  onSelectUser?: (userId: string, userName: string, userAvatar?: string) => void;
}

const DMConversation: React.FC<DMConversationProps> = ({
  user,
  conversationId,
  messages,
  onBack,
  onSendMessage,
  onDeleteMessage,
  onSelectUser
}) => {
  const [message, setMessage] = useState('');

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim()) {
      onSendMessage(message);
      setMessage('');
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="border-b p-3 flex items-center">
        <button 
          onClick={onBack}
          className="p-2 rounded-full hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        
        <div className="flex-1 flex items-center justify-center gap-2">
          <div 
            className="flex items-center cursor-pointer" 
            onClick={() => onSelectUser?.(user.id, user.name, user.avatar)}
          >
            <div className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden">
              {user.avatar && (
                <img 
                  src={user.avatar}
                  alt={user.name}
                  className="w-full h-full object-cover"
                />
              )}
            </div>
            <span className="ml-2 font-medium">{user.name}</span>
          </div>
        </div>
        
        <div className="w-8"></div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4">
        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center text-gray-500">
            No messages yet. Start the conversation!
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((msg) => (
              <div 
                key={msg.id}
                className={`flex ${msg.sender.id === user.id ? 'justify-start' : 'justify-end'}`}
              >
                <div 
                  className={`p-3 max-w-[70%] rounded-lg ${
                    msg.sender.id === user.id 
                      ? 'bg-gray-100 text-gray-800'
                      : 'bg-primary text-white'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      <div className="border-t p-3">
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 border rounded-full p-2 px-4 focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <button
            type="submit"
            disabled={!message.trim()}
            className="p-2 rounded-full bg-primary text-white disabled:opacity-50"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
};

export default DMConversation;
