
import React, { useState } from 'react';
import { Club } from '@/types';
import JoinRequestsDialog from '@/components/admin/join-requests/JoinRequestsDialog';
import UserAvatar from '@/components/shared/UserAvatar';
import { Button } from '@/components/ui/button';

interface ClubHeaderInfoProps {
  club: Club;
  memberCount: number;
  isAdmin?: boolean;
}

const ClubHeaderInfo: React.FC<ClubHeaderInfoProps> = ({ 
  club,
  memberCount,
  isAdmin 
}) => {
  const [showRequestsDialog, setShowRequestsDialog] = useState(false);

  return (
    <div className="flex flex-col items-center md:items-start">
      <div className="mb-4">
        <UserAvatar
          name={club.name}
          image={club.logo}
          size="lg"
        />
      </div>
      
      <div className="text-center md:text-left">
        <h1 className="text-2xl font-bold mb-2">{club.name}</h1>
        
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">
            {memberCount}/5 members
          </span>
          
          {isAdmin && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowRequestsDialog(true)}
            >
              View Requests
            </Button>
          )}
        </div>
      </div>

      <JoinRequestsDialog
        open={showRequestsDialog}
        onOpenChange={setShowRequestsDialog}
        club={club}
      />
    </div>
  );
};

export default ClubHeaderInfo;
