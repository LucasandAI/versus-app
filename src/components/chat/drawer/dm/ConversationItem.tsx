
import React, { useState } from 'react';
import { EyeOff } from 'lucide-react';
import { DMConversation } from '@/hooks/chat/dm/useConversations';
import UserAvatar from '@/components/shared/UserAvatar';
import { formatDistanceToNow } from 'date-fns';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useIsMobile } from '@/hooks/use-mobile';

interface ConversationItemProps {
  conversation: DMConversation;
  isSelected: boolean;
  onSelect: () => void;
  onHide: (e: React.MouseEvent) => void;
}

const ConversationItem: React.FC<ConversationItemProps> = ({
  conversation,
  isSelected,
  onSelect,
  onHide
}) => {
  const [isHideDialogOpen, setIsHideDialogOpen] = useState(false);
  const isMobile = useIsMobile();

  const formattedTime = conversation.timestamp 
    ? formatDistanceToNow(new Date(conversation.timestamp), { addSuffix: false })
    : '';

  const handleHideClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsHideDialogOpen(true);
  };

  const handleConfirmHide = () => {
    onHide(null as any);
    setIsHideDialogOpen(false);
  };

  // Truncate message to a shorter length on mobile
  const characterLimit = isMobile ? 25 : 50;
  const truncatedMessage = conversation.lastMessage
    ? conversation.lastMessage.length > characterLimit
      ? `${conversation.lastMessage.substring(0, characterLimit)}...`
      : conversation.lastMessage
    : '';

  return (
    <>
      <div 
        className={`flex items-start px-4 py-3 cursor-pointer hover:bg-gray-50 relative group
          ${isSelected ? 'bg-primary/10 text-primary' : ''}`}
        onClick={onSelect}
      >
        <UserAvatar
          name={conversation.userName}
          image={conversation.userAvatar}
          size="lg"
          className="flex-shrink-0 mr-3"
        />
        
        <div className="flex-1 min-w-0 overflow-hidden">
          <div className="flex items-center justify-between mb-1">
            <h2 className="font-medium text-lg truncate max-w-[60%]">
              {conversation.userName}
            </h2>
            {formattedTime && (
              <span className="text-xs text-gray-500 flex-shrink-0 ml-auto">
                {formattedTime}
              </span>
            )}
          </div>
          
          <div className="flex items-center">
            <p className="text-sm text-gray-600 truncate flex-1">
              {truncatedMessage}
            </p>
            <button
              onClick={handleHideClick}
              className="flex-shrink-0 p-1.5 ml-2 rounded-full hover:bg-gray-200 transition-colors"
              aria-label={`Hide conversation with ${conversation.userName}`}
            >
              <EyeOff size={isMobile ? 16 : 20} className="text-gray-400" />
            </button>
          </div>
        </div>
      </div>

      <AlertDialog open={isHideDialogOpen} onOpenChange={setIsHideDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hide Conversation</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to hide this conversation with {conversation.userName}? 
              You can unhide it later in the settings.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmHide} className="bg-red-500 hover:bg-red-600">
              Hide Conversation
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default ConversationItem;
