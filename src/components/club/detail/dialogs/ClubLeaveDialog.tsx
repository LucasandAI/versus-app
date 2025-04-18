
import React from 'react';
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

interface ClubLeaveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clubName: string;
  onConfirm: () => void;
}

const ClubLeaveDialog: React.FC<ClubLeaveDialogProps> = ({
  open,
  onOpenChange,
  clubName,
  onConfirm
}) => {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Leave {clubName}?</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to leave this club? You will need to be invited again to rejoin.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} className="bg-red-500 hover:bg-red-600">
            Leave Club
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default ClubLeaveDialog;
