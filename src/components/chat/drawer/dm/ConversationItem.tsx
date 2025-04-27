
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

  return (
    <>
      <div 
        className={`flex items-center px-4 py-3 cursor-pointer hover:bg-gray-50 relative group
          ${isSelected ? 'bg-primary/10 text-primary' : ''}`}
        onClick={onSelect}
      >
        <UserAvatar
          name={conversation.userName}
          image={conversation.userAvatar}
          size="lg"
          className="flex-shrink-0 mr-3"
        />
        
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-baseline">
            <h2 className="font-medium text-lg truncate">
              {conversation.userName}
            </h2>
            {formattedTime && (
              <span className="text-sm text-gray-500 ml-2 shrink-0">
                {formattedTime}
              </span>
            )}
          </div>
          
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm text-gray-600 truncate">
              {conversation.lastMessage}
            </p>
            <button
              onClick={handleHideClick}
              className="shrink-0 p-2 rounded-full hover:bg-gray-200 transition-colors"
              aria-label={`Hide conversation with ${conversation.userName}`}
            >
              <EyeOff size={20} className="text-gray-400" />
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
