
import React, { useState } from 'react';
import { Search, X } from 'lucide-react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription,
  DialogClose
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import UserAvatar from "../shared/UserAvatar";
import { useClubInvites } from '@/hooks/club/useClubInvites';
import { Skeleton } from '@/components/ui/skeleton';

interface InviteUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clubId: string;
}

const InviteUserDialog: React.FC<InviteUserDialogProps> = ({ 
  open, 
  onOpenChange,
  clubId 
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const { users, loading, error, sendInvite } = useClubInvites(clubId);
  
  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleInvite = async (userId: string, userName: string) => {
    const success = await sendInvite(userId, userName);
    
    if (success) {
      toast({
        title: "Invitation Sent",
        description: `Invitation sent to ${userName}`,
      });
    } else {
      toast({
        title: "Error",
        description: "Failed to send invitation",
        variant: "destructive"
      });
    }
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center justify-between p-2">
              <div className="flex items-center gap-3">
                <Skeleton className="h-8 w-8 rounded-full" />
                <Skeleton className="h-4 w-32" />
              </div>
              <Skeleton className="h-8 w-16" />
            </div>
          ))}
        </div>
      );
    }

    if (error) {
      return (
        <p className="text-center text-destructive py-4">
          Error loading users. Please try again.
        </p>
      );
    }

    if (filteredUsers.length === 0) {
      return (
        <p className="text-center text-muted-foreground py-4">
          {users.length === 0 
            ? "No users available to invite" 
            : "No runners found matching your search"}
        </p>
      );
    }

    return (
      <div className="space-y-4">
        {filteredUsers.map((user) => (
          <div 
            key={user.id}
            className="flex items-center justify-between p-2 rounded-lg hover:bg-muted"
          >
            <div className="flex items-center gap-3">
              <UserAvatar name={user.name} image={user.avatar} size="sm" />
              <span className="font-medium">{user.name}</span>
            </div>
            <Button
              size="sm"
              onClick={() => handleInvite(user.id, user.name)}
            >
              Invite
            </Button>
          </div>
        ))}
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Invite Runner</DialogTitle>
          <DialogDescription>
            Search and invite runners to join your club
          </DialogDescription>
        </DialogHeader>
        <DialogClose className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </DialogClose>

        <div className="flex items-center space-x-2 mb-4">
          <Search className="w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search runners..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1"
          />
        </div>

        {renderContent()}
      </DialogContent>
    </Dialog>
  );
};

export default InviteUserDialog;
