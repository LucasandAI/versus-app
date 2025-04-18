
import React from 'react';
import { ArrowLeft, Users } from 'lucide-react';
import { Club } from '@/types';
import UserAvatar from '@/components/shared/UserAvatar';
import Button from '@/components/shared/Button';
import { formatLeagueWithTier } from '@/lib/format';
import { hasPendingInvite } from '@/utils/notificationUtils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ClubHeaderProps {
  club: Club;
  isActuallyMember: boolean;
  isAdmin: boolean;
  onBack: () => void;
  onInvite: () => void;
  onRequestJoin: () => void;
  onLeaveClub: () => void;
  onJoinClub: () => void;
  onDeclineInvite: () => void;
}

const ClubHeader: React.FC<ClubHeaderProps> = ({
  club,
  isActuallyMember,
  isAdmin,
  onBack,
  onInvite,
  onRequestJoin,
  onLeaveClub,
  onJoinClub,
  onDeclineInvite,
}) => {
  // Debug the pending invite status
  console.log('Checking pending invite for club:', club.id);
  const hasPending = hasPendingInvite(club.id);
  console.log('Has pending invite:', hasPending);
  const isClubFull = club.members.length >= 5;

  return (
    <>
      <div className="bg-primary/95 text-white p-4 sticky top-0 z-10">
        <div className="container-mobile">
          <div className="flex items-center">
            <button onClick={onBack} className="mr-2">
              <ArrowLeft className="h-5 w-5" />
            </button>
            <h1 className="text-xl font-bold">{club.name}</h1>
          </div>
        </div>
      </div>

      <div className="bg-white shadow-md">
        <div className="container-mobile py-6">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="flex flex-col items-center md:items-start mb-4 md:mb-0">
              <div className="mb-4">
                <UserAvatar 
                  name={club.name} 
                  image={club.logo} 
                  size="lg"
                  className="h-24 w-24 border-4 border-white shadow-md"
                />
              </div>
              <h2 className="text-2xl font-bold text-center md:text-left">{club.name}</h2>
              <div className="flex items-center mt-2 space-x-2">
                <span className="text-sm bg-gray-100 px-2 py-1 rounded-full text-gray-700 font-medium">
                  {formatLeagueWithTier(club.division, club.tier)}
                </span>
                <span className="text-sm bg-gray-100 px-2 py-1 rounded-full text-gray-700">
                  {club.members.length}/5 members
                </span>
              </div>
            </div>
            
            <div className="flex flex-col items-center md:items-end">
              <div className="flex space-x-2">
                {club.members.length < 5 && isActuallyMember && isAdmin && (
                  <Button 
                    variant="primary" 
                    size="sm"
                    onClick={onInvite}
                  >
                    Invite Runner
                  </Button>
                )}
                
                {!isActuallyMember && hasPending && (
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
                )}
                
                {!isActuallyMember && !hasPending && club.members.length < 5 && (
                  <Button 
                    variant="primary" 
                    size="sm"
                    onClick={onRequestJoin}
                  >
                    Request to Join
                  </Button>
                )}
                
                {isActuallyMember && !isAdmin && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={onLeaveClub}
                  >
                    Leave Club
                  </Button>
                )}
              </div>
            </div>
          </div>
          
          <div className="mt-4 border-t pt-4 text-center md:text-left">
            <p className="text-gray-600 text-sm">
              {club.bio || `Welcome to ${club.name}! We're a group of passionate runners looking to challenge ourselves and improve together.`}
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default ClubHeader;
