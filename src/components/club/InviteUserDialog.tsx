
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

// Mock data for now - in a real app this would come from an API
const mockUsers = [
  { id: 'u1', name: 'John Runner', avatar: '/placeholder.svg' },
  { id: 'u2', name: 'Alice Sprint', avatar: '/placeholder.svg' },
  { id: 'u3', name: 'Charlie Run', avatar: '/placeholder.svg' },
  { id: 'u4', name: 'Diana Dash', avatar: '/placeholder.svg' },
];

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
  
  const filteredUsers = mockUsers.filter(user =>
    user.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleInvite = (userId: string, userName: string) => {
    // In a real app, this would send the invite through an API
    toast({
      title: "Invitation Sent",
      description: `Invitation sent to ${userName}`,
    });
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
          {filteredUsers.length === 0 && (
            <p className="text-center text-muted-foreground py-4">
              No runners found matching your search
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default InviteUserDialog;
