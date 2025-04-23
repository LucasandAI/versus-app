
import React from 'react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export const SUPPORT_OPTIONS = [
  { id: 'bug', label: 'Report a Bug' },
  { id: 'help', label: 'Ask for Help' },
  { id: 'cheating', label: 'Report Cheating' }
];

interface SupportOptionsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectOption: (option: { id: string; label: string }) => void;
}

const SupportOptions: React.FC<SupportOptionsProps> = ({
  open,
  onOpenChange,
  onSelectOption,
}) => {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Select Support Type</AlertDialogTitle>
          <AlertDialogDescription>
            Please select the type of support you need:
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="grid gap-4 py-4">
          {SUPPORT_OPTIONS.map(option => (
            <Button 
              key={option.id}
              variant="outline" 
              className="justify-start text-left font-normal"
              onClick={() => onSelectOption(option)}
            >
              {option.label}
            </Button>
          ))}
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default SupportOptions;
