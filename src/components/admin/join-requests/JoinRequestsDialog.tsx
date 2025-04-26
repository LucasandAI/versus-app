
import React, { useEffect } from 'react';
import { Club } from '@/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useJoinRequests } from '@/hooks/admin/useJoinRequests';
import { fetchClubJoinRequests } from '@/utils/notification-queries';
import JoinRequestItem from './JoinRequestItem';
import EmptyRequests from './EmptyRequests';

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
    isLoading,
    error,
    requests,
    setRequests,
    handleAcceptRequest,
    handleDeclineRequest
  } = useJoinRequests();
  
  const isClubFull = club.members.length >= 5;
  
  useEffect(() => {
    const loadRequests = async () => {
      if (!open) return;
      const requests = await fetchClubJoinRequests(club.id);
      setRequests(requests);
    };
    
    loadRequests();
  }, [open, club.id]);

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

          {isLoading ? (
            <div className="py-8 text-center text-gray-500">Loading requests...</div>
          ) : requests.length > 0 ? (
            <div className="space-y-4">
              {requests.map(request => (
                <JoinRequestItem
                  key={request.id}
                  request={request}
                  onApprove={() => handleAcceptRequest(request, club)}
                  onDeny={() => handleDeclineRequest(request)}
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
