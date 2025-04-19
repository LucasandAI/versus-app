
import React from 'react';
import { Club } from '@/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import JoinRequestItem from './join-requests/JoinRequestItem';
import EmptyRequests from './join-requests/EmptyRequests';
import { useJoinRequests } from '@/hooks/admin/useJoinRequests';

interface JoinRequestsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  club: Club;
}

const JoinRequestsDialog: React.FC<JoinRequestsDialogProps> = ({ 
  open, 
  onOpenChange, 
  club 
}) => {
  const {
    joinRequests,
    isClubFull,
    handleApprove,
    handleDeny
  } = useJoinRequests(club);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Join Requests</DialogTitle>
          <DialogDescription>
            Manage requests to join {club.name}.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {isClubFull && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 mb-4">
              <p className="text-sm text-yellow-800">
                This club is full (5/5 members). You need to remove a member before approving new requests.
              </p>
            </div>
          )}

          {joinRequests.length > 0 ? (
            <div className="space-y-4">
              {joinRequests.map(request => (
                <JoinRequestItem
                  key={request.id}
                  request={request}
                  onApprove={handleApprove}
                  onDeny={handleDeny}
                  isClubFull={isClubFull}
                />
              ))}
            </div>
          ) : (
            <EmptyRequests />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default JoinRequestsDialog;
