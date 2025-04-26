
import React, { useState, useEffect } from 'react';
import { Club, User } from '@/types';
import { ShieldAlert, Users } from 'lucide-react';
import { toast } from "@/hooks/use-toast";
import { useApp } from '@/context/AppContext';
import EditClubDialog from './EditClubDialog';
import JoinRequestsDialog from './join-requests/JoinRequestsDialog';
import MembersManagement from './club-members/MembersManagement';
import AdminActionButtons from './club-members/AdminActionButtons';
import DeleteClubDialog from './DeleteClubDialog';
import { useDeleteClub } from '@/hooks/club/useDeleteClub';
import { Trash } from 'lucide-react';
import Button from '@/components/shared/Button';
import { fetchClubJoinRequests } from '@/utils/notifications/joinRequestQueries';
import { Badge } from "@/components/ui/badge";

interface ClubAdminActionsProps {
  club: Club;
  currentUser: User | null;
}

const ClubAdminActions: React.FC<ClubAdminActionsProps> = ({
  club,
  currentUser
}) => {
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [requestsDialogOpen, setRequestsDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);
  const {
    setCurrentUser,
    setSelectedClub
  } = useApp();
  const {
    deleteClub,
    loading: deleting
  } = useDeleteClub();
  const [currentClub, setCurrentClub] = useState<Club>(club);

  useEffect(() => {
    setCurrentClub(club);
    
    // Fetch pending requests count
    const loadPendingRequests = async () => {
      if (club && club.id) {
        const requests = await fetchClubJoinRequests(club.id);
        setPendingRequestsCount(requests.length);
      }
    };
    
    loadPendingRequests();
    
    // Refresh count every minute
    const interval = setInterval(loadPendingRequests, 60000);
    return () => clearInterval(interval);
  }, [club]);

  const isAdmin = currentUser && currentClub.members.some(member => member.id === currentUser.id && member.isAdmin);

  if (!isAdmin) return null;

  const handleRemoveMember = (memberId: string, memberName: string) => {
    const updatedMembers = currentClub.members.filter(member => member.id !== memberId);
    const updatedClub = {
      ...currentClub,
      members: updatedMembers
    };
    setSelectedClub(updatedClub);
    setCurrentClub(updatedClub);
    if (currentUser) {
      setCurrentUser(prev => {
        if (!prev) return prev;
        const updatedUserClubs = prev.clubs.map(userClub => userClub.id === currentClub.id ? {
          ...userClub,
          members: updatedMembers
        } : userClub);
        return {
          ...prev,
          clubs: updatedUserClubs
        };
      });
    }
    toast({
      title: "Member Removed",
      description: `${memberName} has been removed from the club.`
    });
  };

  const handleMakeAdmin = (memberId: string, memberName: string) => {
    const updatedMembers = currentClub.members.map(member => member.id === memberId ? {
      ...member,
      isAdmin: true
    } : member);
    const updatedClub = {
      ...currentClub,
      members: updatedMembers
    };
    setSelectedClub(updatedClub);
    setCurrentClub(updatedClub);
    if (currentUser) {
      setCurrentUser(prev => {
        if (!prev) return prev;
        const updatedUserClubs = prev.clubs.map(userClub => userClub.id === currentClub.id ? {
          ...userClub,
          members: updatedMembers
        } : userClub);
        return {
          ...prev,
          clubs: updatedUserClubs
        };
      });
    }
    toast({
      title: "Admin Role Granted",
      description: `${memberName} is now an admin of the club.`
    });
  };

  const handleDeleteConfirm = async () => {
    const ok = await deleteClub(currentClub);
    if (ok) setDeleteDialogOpen(false);
  };

  return <div className="bg-white rounded-lg shadow-md p-4 mb-6">
      <div className="flex items-center mb-4">
        <ShieldAlert className="h-5 w-5 text-primary mr-2" />
        <h2 className="font-bold">Admin Actions</h2>
      </div>

      <AdminActionButtons onEditClick={() => setEditDialogOpen(true)} onRequestsClick={() => setRequestsDialogOpen(true)} />
      
      {pendingRequestsCount > 0 && (
        <Button 
          variant="outline" 
          size="sm" 
          className="mt-2 w-full flex items-center justify-center gap-2"
          onClick={() => setRequestsDialogOpen(true)}
        >
          <Users className="h-4 w-4" />
          View Requests
          <Badge variant="secondary" className="ml-2">
            {pendingRequestsCount}
          </Badge>
        </Button>
      )}

      <div className="mt-4">
        
      </div>

      <MembersManagement club={currentClub} onMakeAdmin={handleMakeAdmin} onRemoveMember={handleRemoveMember} />

      <div className="border-t pt-4 mt-4">
        <Button variant="primary" size="sm" className="w-full flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white" onClick={() => setDeleteDialogOpen(true)}>
          <Trash className="h-4 w-4" />
          Delete Club
        </Button>
      </div>

      <EditClubDialog open={editDialogOpen} onOpenChange={setEditDialogOpen} club={currentClub} />

      <JoinRequestsDialog open={requestsDialogOpen} onOpenChange={setRequestsDialogOpen} club={currentClub} />

      <DeleteClubDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen} club={currentClub} loading={deleting} onConfirmDelete={handleDeleteConfirm} />
    </div>;
};

export default ClubAdminActions;
