
import React from 'react';
import { Club } from '@/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { ShieldCheck, ShieldX, UserRound } from 'lucide-react';
import UserAvatar from '../shared/UserAvatar';

interface JoinRequest {
  id: string;
  userId: string;
  name: string;
  avatar: string;
  requestDate: string;
}

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
  // Mock data for join requests
  const joinRequests: JoinRequest[] = [
    {
      id: 'req1',
      userId: 'u10',
      name: 'Alex Runner',
      avatar: '/placeholder.svg',
      requestDate: '2025-04-15T14:48:00.000Z',
    },
    {
      id: 'req2',
      userId: 'u11',
      name: 'Sam Speed',
      avatar: '/placeholder.svg',
      requestDate: '2025-04-16T09:23:00.000Z',
    },
    {
      id: 'req3',
      userId: 'u12',
      name: 'Jamie Jogger',
      avatar: '/placeholder.svg',
      requestDate: '2025-04-17T11:05:00.000Z',
    }
  ];

  const handleApprove = (request: JoinRequest) => {
    // In a real app, this would send the approval to the backend
    if (club.members.length >= 5) {
      toast({
        title: "Club is full",
        description: "The club has reached the maximum number of members.",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Request Approved",
      description: `${request.name} has been added to the club.`,
    });
  };

  const handleDeny = (request: JoinRequest) => {
    // In a real app, this would send the denial to the backend
    toast({
      title: "Request Denied",
      description: `${request.name}'s request has been denied.`,
    });
  };

  const isClubFull = club.members.length >= 5;

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
                <div key={request.id} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                  <div className="flex items-center gap-3">
                    <UserAvatar name={request.name} image={request.avatar} size="sm" />
                    <div>
                      <p className="font-medium">{request.name}</p>
                      <p className="text-xs text-gray-500">
                        Requested {new Date(request.requestDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      variant="outline"
                      className="h-8"
                      onClick={() => handleDeny(request)}
                    >
                      <ShieldX className="h-4 w-4 mr-1" />
                      Deny
                    </Button>
                    <Button 
                      size="sm" 
                      className="h-8"
                      onClick={() => handleApprove(request)}
                      disabled={isClubFull}
                    >
                      <ShieldCheck className="h-4 w-4 mr-1" />
                      Approve
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center p-4">
              <UserRound className="h-12 w-12 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-500">No pending join requests</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default JoinRequestsDialog;
