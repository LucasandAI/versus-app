
import React, { useEffect, useRef } from 'react';
import UserAvatar from '../shared/UserAvatar';
import { useApp } from '@/context/AppContext';
import { ChatMessage } from '@/types/chat';

interface ChatMessagesProps {
  messages: ChatMessage[];
  clubMembers: Array<{
    id: string;
    name: string;
    avatar?: string;
  }>;
}

const ChatMessages: React.FC<ChatMessagesProps> = ({ messages, clubMembers }) => {
  const { setCurrentView, setSelectedUser, currentUser } = useApp();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const isCurrentUser = (senderId: string) => {
    return senderId === currentUser?.id || senderId === 'currentUser';
  };
  
  const getMemberName = (senderId: string) => {
    if (isCurrentUser(senderId)) return 'You';
    const member = clubMembers.find(m => m.id === senderId);
    return member ? member.name : 'Unknown Member';
  };

  const handleUserClick = (senderId: string) => {
    if (isCurrentUser(senderId)) return; // Don't navigate to your own profile
    
    const member = clubMembers.find(m => m.id === senderId);
    if (member) {
      setSelectedUser({
        id: member.id,
        name: member.name,
        avatar: member.avatar || '/placeholder.svg',
        stravaConnected: true,
        clubs: []
      });
      setCurrentView('profile');
    }
  };

  // Get current user's avatar
  const currentUserAvatar = currentUser?.avatar || '/placeholder.svg';

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {messages.length === 0 ? (
        <div className="h-full flex items-center justify-center text-gray-500 text-sm">
          No messages yet. Start the conversation!
        </div>
      ) : (
        messages.map((message) => (
          <div 
            key={message.id}
            className={`flex ${isCurrentUser(message.sender.id) ? 'justify-end' : 'justify-start'}`}
          >
            {!isCurrentUser(message.sender.id) && (
              <UserAvatar 
                name={message.sender.name} 
                image={message.sender.avatar} 
                size="sm" 
                className="mr-2 flex-shrink-0 cursor-pointer"
                onClick={() => handleUserClick(message.sender.id)}
              />
            )}
            
            <div className={`max-w-[70%] ${isCurrentUser(message.sender.id) ? 'order-2' : 'order-1'}`}>
              {!isCurrentUser(message.sender.id) && (
                <button 
                  className="text-xs text-gray-500 mb-1 cursor-pointer hover:text-primary text-left"
                  onClick={() => handleUserClick(message.sender.id)}
                >
                  {message.sender.name}
                </button>
              )}
              
              <div 
                className={`rounded-lg p-3 text-sm break-words ${
                  isCurrentUser(message.sender.id) 
                    ? 'bg-primary text-white' 
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                {message.text}
              </div>
              
              <p className="text-xs text-gray-500 mt-1">{formatTime(message.timestamp)}</p>
            </div>
            
            {isCurrentUser(message.sender.id) && (
              <UserAvatar 
                name={currentUser?.name || "You"} 
                image={currentUserAvatar} 
                size="sm" 
                className="ml-2 flex-shrink-0"
              />
            )}
          </div>
        ))
      )}
      <div ref={messagesEndRef} />
    </div>
  );
};

export default ChatMessages;
