import React from 'react';
import { Trash2 } from 'lucide-react';
import { TooltipProvider, TooltipContent, TooltipTrigger, Tooltip } from '@/components/ui/tooltip';
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

interface MessageDeleteButtonProps {
  onDelete: () => void;
}

const MessageDeleteButton: React.FC<MessageDeleteButtonProps> = ({ onDelete }) => {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <button className="p-1 rounded-full text-gray-400 hover:text-red-500 transition-colors">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Trash2 className="h-4 w-4" />
              </TooltipTrigger>
              <TooltipContent>
                <p>Delete message</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </button>
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
            onClick={onDelete}
            className="bg-red-500 hover:bg-red-600"
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default MessageDeleteButton;
