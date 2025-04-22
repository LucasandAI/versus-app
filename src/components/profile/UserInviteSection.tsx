
import React from 'react';
import { Button } from "@/components/ui/button";
import { UserPlus } from 'lucide-react';
import ClubInviteDialog from '../admin/ClubInviteDialog';
import { User, Club } from '@/types';

interface UserInviteSectionProps {
  showInviteButton: boolean;
  inviteDialogOpen: boolean;
  setInviteDialogOpen: (open: boolean) => void;
  selectedUser: User;
  adminClubs: Club[];
}

const UserInviteSection: React.FC<UserInviteSectionProps> = ({
  showInviteButton,
  inviteDialogOpen,
  setInviteDialogOpen,
  selectedUser,
  adminClubs
}) => {
  if (!showInviteButton) return null;

  return (
    <>
      <Button 
        variant="outline" 
        size="sm" 
        className="flex items-center gap-1 mt-2"
        onClick={() => setInviteDialogOpen(true)}
      >
        <UserPlus className="h-4 w-4" />
        Invite to Club
      </Button>
      
      <ClubInviteDialog 
        open={inviteDialogOpen}
        onOpenChange={setInviteDialogOpen}
        user={selectedUser}
        adminClubs={adminClubs}
      />
    </>
  );
};

export default UserInviteSection;
