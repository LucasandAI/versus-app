
import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Instagram, Linkedin, Globe } from "lucide-react";
import UserAvatar from "@/components/shared/UserAvatar";

interface EditProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: any;
}

const EditProfileDialog = ({ open, onOpenChange, user }: EditProfileDialogProps) => {
  const handleSaveChanges = () => {
    // Mock save functionality
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
        </DialogHeader>
        <div className="space-y-6 py-4">
          <div className="flex items-center gap-4">
            <UserAvatar 
              name={user?.name} 
              image={user?.avatar}
              size="lg"
            />
            <Button variant="outline" size="sm">
              Change Picture
            </Button>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              placeholder="Tell us about yourself"
              defaultValue="Strava Athlete"
              className="resize-none"
            />
          </div>

          <div className="space-y-4">
            <h4 className="text-sm font-medium">Social Links</h4>
            
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Instagram className="h-4 w-4" />
                <Input placeholder="Instagram username" />
              </div>
              
              <div className="flex items-center gap-2">
                <Linkedin className="h-4 w-4" />
                <Input placeholder="LinkedIn username" />
              </div>

              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4" />
                <Input placeholder="Website URL" />
              </div>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSaveChanges}>
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditProfileDialog;
