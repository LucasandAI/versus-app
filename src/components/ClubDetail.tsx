
import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Club, Division, Match } from '@/types';
import ClubHeader from './club/detail/ClubHeader';
import ClubStats from './club/detail/ClubStats';
import ClubCurrentMatch from './club/detail/ClubCurrentMatch';
import ClubMembersList from './club/detail/ClubMembersList';
import { toast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import InviteUserDialog from './club/InviteUserDialog';
import ClubAdminActions from './admin/ClubAdminActions';
import { handleNotification } from '@/lib/notificationUtils';
import { useClubJoin } from '@/hooks/home/useClubJoin';

const ClubDetail: React.FC = () => {
  const { selectedClub, setCurrentView, currentUser, setSelectedUser, setSelectedClub } = useApp();
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);
  const { handleJoinClub } = useClubJoin();
  
  if (!selectedClub) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <p>No club selected</p>
        <button 
          onClick={() => setCurrentView('home')}
          className="mt-4 text-primary hover:underline"
        >
          Go back home
        </button>
      </div>
    );
  }

  const isActuallyMember = currentUser?.clubs.some(club => club.id === selectedClub.id) || false;
  const isAdmin = isActuallyMember && currentUser && selectedClub.members.some(member => 
    member.id === currentUser.id && member.isAdmin
  );

  const handleRequestToJoin = () => {
    if (!selectedClub) return;
    
    toast({
      title: "Request Sent",
      description: `Your request to join ${selectedClub.name} has been sent.`,
    });
  };

  const handleSelectUser = (userId: string, name: string, avatar?: string) => {
    setSelectedUser({
      id: userId,
      name: name,
      avatar: avatar || '/placeholder.svg',
      stravaConnected: true,
      clubs: []
    });
    setCurrentView('profile');
  };

  const handleLeaveClub = () => {
    if (!currentUser || !isActuallyMember) return;
    
    const updatedClubs = currentUser.clubs.filter(club => club.id !== selectedClub.id);
    const updatedUser = {
      ...currentUser,
      clubs: updatedClubs
    };
    
    localStorage.setItem('currentUser', JSON.stringify(updatedUser));
    
    toast({
      title: "Left Club",
      description: `You have successfully left ${selectedClub.name}.`,
    });
    setCurrentView('home');
    
    window.dispatchEvent(new CustomEvent('userDataUpdated'));
  };

  const handleJoinFromInvite = () => {
    if (!selectedClub || !currentUser) return;
    
    const notifications = JSON.parse(localStorage.getItem('notifications') || '[]');
    const invitation = notifications.find(
      (n: any) => n.type === 'invitation' && n.clubId === selectedClub.id
    );
    
    if (invitation) {
      handleNotification(invitation.id, 'delete');
      handleJoinClub(selectedClub.id, selectedClub.name);
    }
  };

  const handleDeclineInvite = () => {
    if (!selectedClub) return;
    
    const notifications = JSON.parse(localStorage.getItem('notifications') || '[]');
    const invitation = notifications.find(
      (n: any) => n.type === 'invitation' && n.clubId === selectedClub.id
    );
    
    if (invitation) {
      handleNotification(invitation.id, 'delete');
      toast({
        title: "Invite Declined",
        description: `You have declined the invitation to join ${selectedClub.name}.`
      });
    }
  };

  return (
    <div className="pb-20 relative">
      <ClubHeader 
        club={selectedClub}
        isActuallyMember={isActuallyMember}
        isAdmin={isAdmin}
        onBack={() => setCurrentView('home')}
        onInvite={() => setShowInviteDialog(true)}
        onRequestJoin={handleRequestToJoin}
        onLeaveClub={() => setShowLeaveDialog(true)}
        onJoinClub={handleJoinFromInvite}
        onDeclineInvite={handleDeclineInvite}
      />

      <div className="container-mobile pt-4">
        <Tabs defaultValue="overview" className="mb-6">
          <TabsList className="grid grid-cols-3 mb-2">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="members">Members</TabsTrigger>
            {selectedClub.matchHistory.length > 0 && (
              <TabsTrigger value="history">History</TabsTrigger>
            )}
          </TabsList>
          
          <TabsContent value="overview">
            <ClubStats 
              club={selectedClub} 
              matchHistory={selectedClub.matchHistory} 
            />
            {selectedClub.currentMatch && (
              <ClubCurrentMatch
                match={selectedClub.currentMatch}
                onViewProfile={handleSelectUser}
              />
            )}
          </TabsContent>
          
          <TabsContent value="members">
            <ClubMembersList
              members={selectedClub.members}
              currentMatch={selectedClub.currentMatch}
              onSelectMember={handleSelectUser}
            />
          </TabsContent>
        </Tabs>

        {selectedClub && currentUser && isActuallyMember && (
          <ClubAdminActions club={selectedClub} currentUser={currentUser} />
        )}
      </div>

      <AlertDialog open={showLeaveDialog} onOpenChange={setShowLeaveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Leave {selectedClub.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to leave this club? You will need to be invited again to rejoin.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleLeaveClub} className="bg-red-500 hover:bg-red-600">
              Leave Club
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {selectedClub && (
        <InviteUserDialog
          open={showInviteDialog}
          onOpenChange={setShowInviteDialog}
          clubId={selectedClub.id}
        />
      )}
    </div>
  );
};

export default ClubDetail;
