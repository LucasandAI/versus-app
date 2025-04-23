import React, { useEffect, useRef } from 'react';
import { Trash2 } from 'lucide-react';
import UserAvatar from '../shared/UserAvatar';
import { useApp } from '@/context/AppContext';
import { ChatMessage } from '@/types/chat';
import { useNavigation } from '@/hooks/useNavigation';
import { Button } from '../ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface ChatMessagesProps {
  messages: ChatMessage[] | any[];
  clubMembers: Array<{
    id: string;
    name: string;
    avatar?: string;
  }>;
  isSupport?: boolean;
  onDeleteMessage?: (messageId: string) => void;
}

const ChatMessages: React.FC<ChatMessagesProps> = ({ 
  messages, 
  clubMembers, 
  isSupport = false,
  onDeleteMessage 
}) => {
  const { currentUser } = useApp();
  const { navigateToUserProfile, navigateToClub } = useNavigation();
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
    if (isCurrentUser(senderId) || isSupport) return;
    
    const member = clubMembers.find(m => m.id === senderId);
    if (member) {
      navigateToUserProfile(member.id, member.name, member.avatar || '/placeholder.svg');
    }
  };

  const handleClubNameClick = (clubId: string, clubName: string) => {
    navigateToClub({ id: clubId, name: clubName });
  };

  // Get current user's avatar
  const currentUserAvatar = currentUser?.avatar || '/placeholder.svg';

  // Function to normalize messages from different sources
  const normalizeMessage = (message: any): ChatMessage => {
    // If it's already in the right format
    if (message.text !== undefined) {
      return message as ChatMessage;
    }
    
    // If it's from Supabase club_chat_messages table
    if (message.message !== undefined) {
      return {
        id: message.id,
        text: message.message,
        sender: {
          id: message.sender_id,
          name: getMemberName(message.sender_id),
          avatar: clubMembers.find(m => m.id === message.sender_id)?.avatar
        },
        timestamp: message.timestamp,
        isSupport: false
      };
    }
    
    // Fallback to prevent errors
    console.error("Unknown message format:", message);
    return {
      id: message.id || `unknown-${Date.now()}`,
      text: message.message || message.text || "Unknown message",
      sender: {
        id: message.sender_id || "unknown",
        name: "Unknown User",
        avatar: '/placeholder.svg'
      },
      timestamp: message.timestamp || new Date().toISOString(),
      isSupport: false
    };
  };

  const renderMessage = (message: any) => {
    const normalizedMessage = normalizeMessage(message);
    const isUserMessage = isCurrentUser(normalizedMessage.sender.id);

    return (
      <div 
        key={normalizedMessage.id}
        className={`flex ${isUserMessage ? 'justify-end' : 'justify-start'} group`}
      >
        {!isUserMessage && (
          <UserAvatar 
            name={normalizedMessage.sender.name} 
            image={normalizedMessage.sender.avatar} 
            size="sm" 
            className={`mr-2 flex-shrink-0 ${!isSupport && 'cursor-pointer'}`}
            onClick={!isSupport ? () => handleUserClick(normalizedMessage.sender.id) : undefined}
          />
        )}
        
        <div className={`max-w-[70%] ${isUserMessage ? 'order-2' : 'order-1'}`}>
          {!isUserMessage && (
            <button 
              className={`text-xs text-gray-500 mb-1 ${!isSupport && 'cursor-pointer hover:text-primary'} text-left`}
              onClick={!isSupport ? () => handleUserClick(normalizedMessage.sender.id) : undefined}
            >
              {normalizedMessage.sender.name}
              {normalizedMessage.isSupport && <span className="ml-1 text-blue-500">(Support)</span>}
            </button>
          )}
          
          <div className="flex items-start gap-2">
            <div 
              className={`rounded-lg p-3 text-sm break-words flex-grow ${
                isUserMessage 
                  ? 'bg-primary text-white' 
                  : normalizedMessage.isSupport
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-gray-100 text-gray-800'
              }`}
            >
              {normalizedMessage.text}
            </div>

            {isUserMessage && onDeleteMessage && !isSupport && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Trash2 className="h-4 w-4 text-gray-500 hover:text-red-500" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Delete message</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Message</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete this message? This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => onDeleteMessage(normalizedMessage.id)}
                      className="bg-red-500 hover:bg-red-600"
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
          
          <p className="text-xs text-gray-500 mt-1">{formatTime(normalizedMessage.timestamp)}</p>
        </div>
        
        {isUserMessage && (
          <UserAvatar 
            name={currentUser?.name || "You"} 
            image={currentUserAvatar} 
            size="sm" 
            className="ml-2 flex-shrink-0"
          />
        )}
      </div>
    );
  };

  if (!Array.isArray(messages)) {
    console.error("Messages is not an array:", messages);
    return (
      <div className="flex-1 overflow-y-auto p-4">
        <div className="h-full flex items-center justify-center text-gray-500 text-sm">
          No messages yet. Start the conversation!
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {messages.length === 0 ? (
        <div className="h-full flex items-center justify-center text-gray-500 text-sm">
          No messages yet. Start the conversation!
        </div>
      ) : (
        messages.map(renderMessage)
      )}
      <div ref={messagesEndRef} />
    </div>
  );
};

export default ChatMessages;
