
import React from 'react';
import Button from '@/components/shared/Button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ClubHeaderActionsProps {
  isActuallyMember: boolean;
  isAdmin: boolean;
  memberCount: number;
  hasPendingInvite: boolean;
  onInvite: () => void;
  onLeaveClub: () => void;
  onJoinClub: () => void;
  onDeclineInvite: () => void;
  onRequestJoin: () => void;
}

const ClubHeaderActions: React.FC<ClubHeaderActionsProps> = ({
  isActuallyMember,
  isAdmin,
  memberCount,
  hasPendingInvite,
  onInvite,
  onLeaveClub,
  onJoinClub,
  onDeclineInvite,
  onRequestJoin,
}) => {
  const isClubFull = memberCount >= 5;

  if (isActuallyMember) {
    if (isAdmin) {
      return (
        <div className="flex space-x-2">
          {memberCount < 5 && (
            <Button 
              variant="primary" 
              size="sm"
              onClick={onInvite}
            >
              Invite Runner
            </Button>
          )}
          <Button 
            variant="outline" 
            size="sm"
            onClick={onLeaveClub}
          >
            Leave Club
          </Button>
        </div>
      );
    }
    
    return (
      <Button 
        variant="outline" 
        size="sm"
        onClick={onLeaveClub}
      >
        Leave Club
      </Button>
    );
  }
  
  if (hasPendingInvite) {
    return (
      <div className="flex space-x-2">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span>
                <Button 
                  variant="primary" 
                  size="sm"
                  onClick={onJoinClub}
                  disabled={isClubFull}
                >
                  Join Club
                </Button>
              </span>
            </TooltipTrigger>
            {isClubFull && (
              <TooltipContent>
                <p>This club is currently full</p>
              </TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>
        
        <Button 
          variant="outline" 
          size="sm"
          onClick={onDeclineInvite}
        >
          Decline Invite
        </Button>
      </div>
    );
  }
  
  if (memberCount < 5) {
    return (
      <Button 
        variant="primary" 
        size="sm"
        onClick={onRequestJoin}
      >
        Request to Join
      </Button>
    );
  }
  
  return null;
};

export default ClubHeaderActions;
