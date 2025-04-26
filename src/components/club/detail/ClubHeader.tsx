
import React from 'react';
import { Users } from 'lucide-react';
import { Club } from '@/types';
import UserAvatar from '@/components/shared/UserAvatar';
import Button from '@/components/shared/Button';
import { formatLeagueWithTier } from '@/lib/format';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import AppHeader from '@/components/shared/AppHeader';
import { Skeleton } from "@/components/ui/skeleton";

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
  hasPendingInvite: boolean;
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
  hasPendingInvite,
}) => {
  // Handle null club case
  if (!club || typeof club !== 'object') {
    return <ClubHeaderLoadingSkeleton onBack={onBack} />;
  }

  // Safe club properties with fallbacks
  const clubName = club.name || 'Unnamed Club';
  const clubLogo = club.logo || '/placeholder.svg';
  const clubBio = club.bio || `Welcome to this running club! We're a group of passionate runners looking to challenge ourselves and improve together.`;
  const division = club.division || 'bronze';
  const tier = typeof club.tier === 'number' ? club.tier : 5;
  
  // Use optional chaining and nullish coalescing to prevent crashes
  const memberCount = Array.isArray(club.members) ? club.members.length : 0;
  const isClubFull = memberCount >= 5;

  const renderActionButtons = () => {
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

  return (
    <>
      <AppHeader 
        title={clubName}
        onBack={onBack}
      />

      <div className="bg-white shadow-md">
        <div className="container-mobile py-6">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="flex flex-col items-center md:items-start mb-4 md:mb-0">
              <div className="mb-4">
                <UserAvatar 
                  name={clubName} 
                  image={clubLogo} 
                  size="lg"
                  className="h-24 w-24 border-4 border-white shadow-md"
                />
              </div>
              <h2 className="text-2xl font-bold text-center md:text-left">{clubName}</h2>
              <div className="flex items-center mt-2 space-x-2">
                <span className="text-sm bg-gray-100 px-2 py-1 rounded-full text-gray-700 font-medium">
                  {formatLeagueWithTier(division, tier)}
                </span>
                <span className="text-sm bg-gray-100 px-2 py-1 rounded-full text-gray-700">
                  {`${memberCount}/5 members`}
                </span>
              </div>
            </div>
            
            <div className="flex flex-col items-center md:items-end">
              <div className="flex space-x-2">
                {renderActionButtons()}
              </div>
            </div>
          </div>
          
          <div className="mt-4 border-t pt-4 text-center md:text-left">
            <p className="text-gray-600 text-sm">{clubBio}</p>
          </div>
        </div>
      </div>
    </>
  );
};

// Loading skeleton for header when data is not yet available
const ClubHeaderLoadingSkeleton: React.FC<{onBack: () => void}> = ({ onBack }) => {
  return (
    <>
      <AppHeader 
        title="Loading club..."
        onBack={onBack}
      />
      
      <div className="bg-white shadow-md">
        <div className="container-mobile py-6">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="flex flex-col items-center md:items-start mb-4 md:mb-0">
              <div className="mb-4">
                <Skeleton className="h-24 w-24 rounded-full" />
              </div>
              <Skeleton className="h-8 w-48 mb-2" />
              <div className="flex items-center mt-2 space-x-2">
                <Skeleton className="h-6 w-24" />
                <Skeleton className="h-6 w-24" />
              </div>
            </div>
          </div>
          <div className="mt-4 border-t pt-4">
            <Skeleton className="h-16 w-full" />
          </div>
        </div>
      </div>
    </>
  );
};

export default ClubHeader;
