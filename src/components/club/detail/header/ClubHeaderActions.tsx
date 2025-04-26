
import React, { useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { useJoinRequest } from '@/hooks/club/useJoinRequest';
import { useApp } from '@/context/AppContext';
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
  clubId: string;
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
  clubId,
}) => {
  const isClubFull = memberCount >= 5;
  const { currentUser } = useApp();
  const { isRequesting, hasPendingRequest, sendJoinRequest, checkPendingRequest } = useJoinRequest(clubId);

  useEffect(() => {
    if (currentUser?.id && !isActuallyMember) {
      checkPendingRequest(currentUser.id);
    }
  }, [currentUser?.id, isActuallyMember]);

  const handleRequestJoin = async () => {
    if (!currentUser?.id) return;
    await sendJoinRequest(currentUser.id);
  };

  if (isActuallyMember) {
    if (isAdmin) {
      return (
        <div className="flex space-x-2">
          {memberCount < 5 && (
            <Button 
              variant="default" 
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
                  variant="default" 
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

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span>
            <Button
              variant="default"
              size="sm"
              onClick={handleRequestJoin}
              disabled={isRequesting || hasPendingRequest || isClubFull}
            >
              {hasPendingRequest ? 'Request Pending' : 'Request to Join'}
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
  );
};

export default ClubHeaderActions;
