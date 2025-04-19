
import React from 'react';
import { Button } from "@/components/ui/button";
import { ShieldCheck, ShieldX } from 'lucide-react';

interface JoinRequestButtonsProps {
  request: {
    id: string;
    userId: string;
    name: string;
  };
  onDeny: (request: any) => void;
  onApprove: (request: any) => void;
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
  );
};

export default JoinRequestButtons;
