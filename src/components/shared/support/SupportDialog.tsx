
import React from 'react';
import { SupportOption } from './SupportOptionsList';
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

interface SupportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedOption: SupportOption | null;
  message: string;
  onMessageChange: (message: string) => void;
  onSubmit: () => void;
}

const SupportDialog: React.FC<SupportDialogProps> = ({
  open,
  onOpenChange,
  selectedOption,
  message,
  onMessageChange,
  onSubmit
}) => {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {selectedOption?.label}
          </AlertDialogTitle>
          <AlertDialogDescription>
            Please provide details about your {selectedOption?.label.toLowerCase()}.
            Our team will review your submission and open a support chat to assist you.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="grid gap-4 py-4">
          <textarea 
            className="w-full min-h-[100px] p-2 border rounded-md" 
            placeholder={`Describe your ${selectedOption?.label.toLowerCase()} in detail...`}
            value={message}
            onChange={(e) => onMessageChange(e.target.value)}
          />
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => onMessageChange('')}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onSubmit}>Submit</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default SupportDialog;
