
import React from 'react';
import { Button } from "@/components/ui/button";
import { ShieldCheck, ShieldX } from 'lucide-react';
import { JoinRequest } from '@/types';

interface JoinRequestButtonsProps {
  request: JoinRequest;
  onDeny: () => void;
  onApprove: () => void;
  isClubFull: boolean;
}

const JoinRequestButtons: React.FC<JoinRequestButtonsProps> = ({
  request,
  onDeny,
  onApprove,
  isClubFull
}) => {
  return (
    <div className="flex gap-2">
      <Button 
        size="sm" 
        variant="outline"
        className="h-8"
        onClick={onDeny}
      >
        <ShieldX className="h-4 w-4 mr-1" />
        Deny
      </Button>
      <Button 
        size="sm" 
        className="h-8"
        onClick={onApprove}
        disabled={isClubFull}
      >
        <ShieldCheck className="h-4 w-4 mr-1" />
        Approve
      </Button>
    </div>
  );
};

export default JoinRequestButtons;
