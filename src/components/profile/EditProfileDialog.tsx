
import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { User } from "@/types";
import { useApp } from "@/context/AppContext";
import AvatarSection from "./edit-profile/AvatarSection";
import BasicInfoSection from "./edit-profile/BasicInfoSection";
import SocialLinksSection from "./edit-profile/SocialLinksSection";

interface EditProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: User | null;
}

const EditProfileDialog = ({ open, onOpenChange, user }: EditProfileDialogProps) => {
  const { setCurrentUser, setSelectedUser } = useApp();
  const [name, setName] = useState(user?.name || "");
  const [bio, setBio] = useState(user?.bio || "Strava Athlete");
  const [instagram, setInstagram] = useState(user?.instagram || "");
  const [linkedin, setLinkedin] = useState(user?.linkedin || "");
  const [twitter, setTwitter] = useState(user?.twitter || "");
  const [facebook, setFacebook] = useState(user?.facebook || "");
  const [website, setWebsite] = useState(user?.website || "");
  const [tiktok, setTiktok] = useState(user?.tiktok || "");
  const [avatar, setAvatar] = useState(user?.avatar || "");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [previewKey, setPreviewKey] = useState(Date.now());
  const isMobile = useIsMobile();

  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setBio(user.bio || "Strava Athlete");
      setInstagram(user.instagram || "");
      setTwitter(user.twitter || "");
      setFacebook(user.facebook || "");
      setLinkedin(user.linkedin || "");
      setWebsite(user.website || "");
      setTiktok(user.tiktok || "");
      setAvatar(user.avatar || "");
      setAvatarFile(null);
      setPreviewKey(Date.now());
    }
  }, [user, open]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const previewUrl = URL.createObjectURL(file);
      setAvatar(previewUrl);
      setAvatarFile(file);
      setPreviewKey(Date.now());
    }
  };

  const handleSaveChanges = () => {
    if (!name.trim()) {
      toast({
        title: "Error",
        description: "Name cannot be empty",
        variant: "destructive",
      });
      return;
    }

    if (!user) {
      toast({
        title: "Error",
        description: "No user found to update",
        variant: "destructive",
      });
      return;
    }
    
    const updatedUser = {
      ...user,
      name,
      bio,
      instagram,
      linkedin,
      twitter,
      facebook,
      website,
      tiktok,
      avatar
    };
    
    setCurrentUser(updatedUser);
    setSelectedUser(updatedUser);

    toast({
      title: "Profile Updated",
      description: "Your profile has been updated successfully",
    });
    
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={`${isMobile ? 'w-[95vw] max-w-[95vw]' : 'sm:max-w-[425px]'}`}>
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
        </DialogHeader>
        <div className="space-y-6 py-4">
          <AvatarSection
            name={name}
            avatar={avatar}
            handleAvatarChange={handleAvatarChange}
            previewKey={previewKey}
          />

          <BasicInfoSection
            name={name}
            setName={setName}
            bio={bio}
            setBio={setBio}
          />

          <SocialLinksSection
            instagram={instagram}
            setInstagram={setInstagram}
            linkedin={linkedin}
            setLinkedin={setLinkedin}
            twitter={twitter}
            setTwitter={setTwitter}
            facebook={facebook}
            setFacebook={setFacebook}
            website={website}
            setWebsite={setWebsite}
            tiktok={tiktok}
            setTiktok={setTiktok}
          />
        </div>
        <DialogFooter className={`${isMobile ? 'flex-col gap-2' : ''}`}>
          <Button variant="outline" onClick={() => onOpenChange(false)} className={isMobile ? 'w-full' : ''}>
            Cancel
          </Button>
          <Button onClick={handleSaveChanges} className={isMobile ? 'w-full' : ''}>
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditProfileDialog;
