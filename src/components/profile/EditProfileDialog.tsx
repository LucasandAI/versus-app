
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
import { useIsMobile } from "@/hooks/use-mobile";
import { User } from "@/types";
import AvatarUploadSection from "./edit/AvatarUploadSection";
import SocialLinksSection from "./edit/SocialLinksSection";
import { useProfileForm } from "@/hooks/profile/useProfileForm";

interface EditProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: User | null;
}

const EditProfileDialog = ({ open, onOpenChange, user }: EditProfileDialogProps) => {
  const isMobile = useIsMobile();
  const { 
    formState,
    handleAvatarChange, 
    handleSocialChange, 
    handleFormSubmit 
  } = useProfileForm(user, () => onOpenChange(false));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={`${isMobile ? 'w-[95vw] max-w-[95vw]' : 'sm:max-w-[425px]'}`}>
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
        </DialogHeader>
        <div className="space-y-6 py-4">
          <AvatarUploadSection
            avatar={formState.avatar}
            name={user?.name || ""}
            previewKey={formState.previewKey}
            onAvatarChange={handleAvatarChange}
          />

          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={formState.name}
              onChange={(e) => handleSocialChange('name', e.target.value)}
              placeholder="Your name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              value={formState.bio}
              onChange={(e) => handleSocialChange('bio', e.target.value)}
              placeholder="Tell us about yourself"
              className="resize-none"
              rows={3}
            />
          </div>

          <SocialLinksSection
            instagram={formState.instagram}
            linkedin={formState.linkedin}
            twitter={formState.twitter}
            facebook={formState.facebook}
            website={formState.website}
            tiktok={formState.tiktok}
            onSocialChange={handleSocialChange}
          />
        </div>
        <DialogFooter className={`${isMobile ? 'flex-col gap-2' : ''}`}>
          <Button variant="outline" onClick={() => onOpenChange(false)} className={isMobile ? 'w-full' : ''}>
            Cancel
          </Button>
          <Button onClick={handleFormSubmit} className={isMobile ? 'w-full' : ''}>
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditProfileDialog;
