
import React from 'react';
import { X } from 'lucide-react';
import UserAvatar from '@/components/shared/UserAvatar';
import type { DMConversation } from '@/hooks/chat/dm/useConversations';
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

  const handleHideClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowConfirmDialog(true);
  };

  const handleConfirmHide = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowConfirmDialog(false);
    onHide(e);
  };

  return (
    <>
      <button
        onClick={onSelect}
        className={`flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100 transition-colors w-full text-left group ${
          isSelected ? 'bg-gray-100' : ''
        }`}
      >
        <UserAvatar
          name={conversation.userName}
          image={conversation.userAvatar}
          size="sm"
        />
        <div className="flex-1 min-w-0">
          <p className="font-medium truncate">{conversation.userName}</p>
          {conversation.lastMessage && (
            <p className="text-sm text-gray-500 truncate">{conversation.lastMessage}</p>
          )}
        </div>
        <button
          onClick={handleHideClick}
          className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-200 rounded transition-all"
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
