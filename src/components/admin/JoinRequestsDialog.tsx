
import React, { useEffect, useState } from 'react';
import { Club, JoinRequest } from '@/types';
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
import { supabase } from '@/integrations/supabase/client';

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
  const [joinRequests, setJoinRequests] = useState<JoinRequest[]>([]);
  const [loading, setLoading] = useState(true);
  
  const {
    isLoading,
    error,
    handleAcceptRequest,
    handleDeclineRequest
  } = useJoinRequests();

  const isClubFull = club.members.length >= 5;
  
  // Fetch join requests from Supabase when dialog opens
  useEffect(() => {
    const fetchJoinRequests = async () => {
      if (!open) return;
      
      setLoading(true);
      try {
        // Mock fetching join requests - in real app this would be a Supabase query
        // This is just a placeholder since we don't have the join_requests table yet
        const mockRequests: JoinRequest[] = [];
        setJoinRequests(mockRequests);
      } catch (error) {
        console.error('Error fetching join requests:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchJoinRequests();
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

          {loading ? (
            <div className="py-8 text-center text-gray-500">Loading requests...</div>
          ) : joinRequests.length > 0 ? (
            <div className="space-y-4">
              {joinRequests.map(request => (
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
