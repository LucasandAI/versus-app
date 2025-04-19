
import React from 'react';
import { Button } from "@/components/ui/button";
import { ShieldCheck, ShieldX } from 'lucide-react';
import UserAvatar from '@/components/shared/UserAvatar';

interface JoinRequest {
  id: string;
  userId: string;
  name: string;
  avatar: string;
  requestDate: string;
}

interface JoinRequestItemProps {
  request: JoinRequest;
  onApprove: (request: JoinRequest) => void;
  onDeny: (request: JoinRequest) => void;
  isClubFull: boolean;
}

const JoinRequestItem: React.FC<JoinRequestItemProps> = ({
  request,
  onApprove,
  onDeny,
  isClubFull
}) => {
  return (
    <div className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
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
          onClick={() => onDeny(request)}
        >
          <ShieldX className="h-4 w-4 mr-1" />
          Deny
        </Button>
        <Button 
          size="sm" 
          className="h-8"
          onClick={() => onApprove(request)}
          disabled={isClubFull}
        >
          <ShieldCheck className="h-4 w-4 mr-1" />
          Approve
        </Button>
      </div>
    </div>
  );
};

export default JoinRequestItem;
