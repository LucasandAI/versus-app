
import React from 'react';
import { Club } from '@/types';

interface ChatClubContainerProps {
  selectedClub: Club | null;
  messages: Record<string, any[]>;
  onSendMessage: (message: string, clubId?: string) => void;
  onDeleteMessage?: (messageId: string) => void;
  setClubMessages?: React.Dispatch<React.SetStateAction<Record<string, any[]>>>;
}

const ChatClubContainer: React.FC<ChatClubContainerProps> = ({
  selectedClub,
  messages,
  onSendMessage,
  onDeleteMessage,
  setClubMessages
}) => {
  if (!selectedClub) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-gray-500">Select a club to start chatting</p>
      </div>
    );
  }
  
  // Extract the messages for the selected club from the Record
  const clubMessages = messages[selectedClub.id] || [];
  
  return (
    <div className="h-full flex flex-col">
      {/* Chat header component would go here */}
      <div className="flex-1 overflow-auto p-4">
        {/* Render messages */}
        <div className="space-y-4">
          {clubMessages.map(message => (
            <div key={message.id} className="bg-gray-100 p-3 rounded-lg">
              <div className="flex justify-between">
                <p className="font-medium">{message.sender?.name || 'Unknown'}</p>
                {onDeleteMessage && (
                  <button 
                    onClick={() => onDeleteMessage(message.id)}
                    className="text-red-500 text-sm"
                  >
                    Delete
                  </button>
                )}
              </div>
              <p>{message.message || message.text}</p>
              <p className="text-xs text-gray-500 mt-1">
                {new Date(message.timestamp).toLocaleString()}
              </p>
            </div>
          ))}
          
          {clubMessages.length === 0 && (
            <p className="text-center text-gray-500">No messages yet</p>
          )}
        </div>
      </div>
      
      {/* Message input */}
      <div className="p-4 border-t">
        <form 
          onSubmit={(e) => {
            e.preventDefault();
            const input = e.currentTarget.elements.namedItem('message') as HTMLInputElement;
            if (input.value.trim()) {
              onSendMessage(input.value, selectedClub.id);
              input.value = '';
            }
          }}
          className="flex gap-2"
        >
          <input 
            type="text" 
            name="message" 
            placeholder="Type a message..." 
            className="flex-1 border rounded-md px-3 py-2"
          />
          <button 
            type="submit"
            className="bg-primary text-white px-4 py-2 rounded-md"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatClubContainer;
