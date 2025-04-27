
import React from 'react';
import { X } from 'lucide-react';
import UserAvatar from '@/components/shared/UserAvatar';
import type { DMConversation } from '@/hooks/chat/dm/useConversations';
import { useMessageFormatting } from '@/hooks/chat/messages/useMessageFormatting';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

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
  const [showConfirmDialog, setShowConfirmDialog] = React.useState(false);
  const { formatTime } = useMessageFormatting();

  const handleHideClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowConfirmDialog(true);
  };

  const handleConfirmHide = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowConfirmDialog(false);
    onHide(e);
  };

  const truncateMessage = (message: string) => {
    if (!message) return '';
    if (message.length <= 15) return message;
    return `${message.substring(0, 15)}...`;
  };

  return (
    <>
      <button
        onClick={onSelect}
        className={`flex items-start space-x-3 p-2 rounded-lg hover:bg-gray-100 transition-colors w-full text-left group relative ${
          isSelected ? 'bg-gray-100' : ''
        }`}
      >
        <UserAvatar
          name={conversation.userName}
          image={conversation.userAvatar}
          size="sm"
        />
        
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-center w-full mb-0.5">
            <span className="font-medium truncate max-w-[60%]">
              {conversation.userName}
            </span>
            {conversation.timestamp && (
              <span className="text-xs text-gray-400 ml-2 whitespace-nowrap flex-shrink-0">
                {formatTime(conversation.timestamp)}
              </span>
            )}
          </div>
          
          <p className="text-sm text-gray-500 truncate max-w-[90%]">
            {conversation.lastMessage ? truncateMessage(conversation.lastMessage) : ''}
          </p>
        </div>

        <button
          onClick={handleHideClick}
          className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 p-1.5 hover:bg-gray-200 rounded transition-all"
          aria-label="Hide conversation"
        >
          <X className="h-4 w-4 text-gray-500" />
        </button>
      </button>

      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hide Conversation</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to hide this conversation? You can reopen it later by searching for the user.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={(e) => e.stopPropagation()}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmHide}>Hide</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default ConversationItem;
