
import React, { useState } from 'react';
import { Club, User } from '@/types';
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { Edit, UserMinus, Users, ShieldAlert, UserCog } from 'lucide-react';
import EditClubDialog from './EditClubDialog';
import JoinRequestsDialog from './JoinRequestsDialog';

interface ClubAdminActionsProps {
  club: Club;
  currentUser: User | null;
}

const ClubAdminActions: React.FC<ClubAdminActionsProps> = ({ club, currentUser }) => {
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [requestsDialogOpen, setRequestsDialogOpen] = useState(false);

  // Check if the current user is an admin of this club
  const isAdmin = currentUser && club.members.some(member => 
    member.id === currentUser.id && member.isAdmin
  );

  if (!isAdmin) return null;

  const handleRemoveMember = (memberId: string, memberName: string) => {
    // In a real app, this would call an API to remove the member
    toast({
      title: "Member Removed",
      description: `${memberName} has been removed from the club.`,
    });
  };
  
  const handleMakeAdmin = (memberId: string, memberName: string) => {
    // In a real app, this would call an API to make the member an admin
    toast({
      title: "Admin Role Granted",
      description: `${memberName} is now an admin of the club.`,
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4 mb-6">
      <div className="flex items-center mb-4">
        <ShieldAlert className="h-5 w-5 text-primary mr-2" />
        <h2 className="font-bold">Admin Actions</h2>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Button 
          variant="outline" 
          className="flex items-center gap-2 justify-center"
          onClick={() => setEditDialogOpen(true)}
        >
          <Edit className="h-4 w-4" />
          <span>Edit Club</span>
        </Button>
        
        <Button 
          variant="outline" 
          className="flex items-center gap-2 justify-center"
          onClick={() => setRequestsDialogOpen(true)}
        >
          <Users className="h-4 w-4" />
          <span>View Requests</span>
        </Button>
      </div>

      <div className="mt-6">
        <h3 className="text-sm font-medium mb-2">Manage Members</h3>
        <div className="space-y-2">
          {club.members.filter(member => !member.isAdmin).map(member => (
            <div key={member.id} className="flex items-center justify-between">
              <span className="text-sm">{member.name}</span>
              <div className="flex items-center gap-1">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-8 text-blue-500 hover:text-blue-700 hover:bg-blue-50"
                  onClick={() => handleMakeAdmin(member.id, member.name)}
                >
                  <UserCog className="h-4 w-4" />
                  <span className="sr-only">Make Admin</span>
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                  onClick={() => handleRemoveMember(member.id, member.name)}
                >
                  <UserMinus className="h-4 w-4" />
                  <span className="sr-only">Remove</span>
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <EditClubDialog 
        open={editDialogOpen} 
        onOpenChange={setEditDialogOpen} 
        club={club} 
      />

      <JoinRequestsDialog 
        open={requestsDialogOpen} 
        onOpenChange={setRequestsDialogOpen} 
        club={club} 
      />
    </div>
  );
};

export default ClubAdminActions;
