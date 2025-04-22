
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
import { safeSupabase } from '@/integrations/supabase/safeClient';

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
  const [isSaving, setIsSaving] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    if (user && open) {
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

  const uploadAvatar = async (userId: string, file: File): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;
      
      // Ensure the avatars bucket exists
      // This is a basic check, in a production app you might want to handle this more gracefully
      try {
        const { data: buckets } = await safeSupabase.storage.listBuckets();
        if (!buckets?.find(bucket => bucket.name === 'avatars')) {
          // If bucket doesn't exist, try to create it
          const { error: createBucketError } = await safeSupabase.storage.createBucket('avatars', {
            public: true
          });
          
          if (createBucketError) {
            console.error('Error creating avatars bucket:', createBucketError);
          }
        }
      } catch (error) {
        console.error('Error checking for avatars bucket:', error);
      }
      
      const { error: uploadError } = await safeSupabase.storage
        .from('avatars')
        .upload(filePath, file, {
          upsert: true
        });
        
      if (uploadError) {
        console.error('Error uploading avatar:', uploadError);
        return null;
      }
      
      const { data } = safeSupabase.storage
        .from('avatars')
        .getPublicUrl(filePath);
        
      return data.publicUrl;
    } catch (error) {
      console.error('Error in avatar upload process:', error);
      return null;
    }
  };

  const handleSaveChanges = async () => {
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
    
    setIsSaving(true);
    
    try {
      let avatarUrl = avatar;
      
      if (avatarFile) {
        const uploadedUrl = await uploadAvatar(user.id, avatarFile);
        if (uploadedUrl) {
          avatarUrl = uploadedUrl;
        } else {
          toast({
            title: "Warning",
            description: "Failed to upload new avatar, keeping existing one",
            variant: "destructive",
          });
        }
      }
      
      const { error } = await safeSupabase
        .from('users')
        .update({
          name,
          bio,
          instagram,
          twitter,
          facebook,
          linkedin,
          website,
          tiktok,
          avatar: avatarUrl,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);
        
      if (error) {
        throw error;
      }
      
      // Update local state with the new user data
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
        avatar: avatarUrl
      };
      
      setCurrentUser(updatedUser);
      setSelectedUser(updatedUser);
      
      // Trigger a refresh of user data
      window.dispatchEvent(new CustomEvent('userDataUpdated'));

      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully",
      });
      
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Update Failed",
        description: "There was an error updating your profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
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
          <Button variant="outline" onClick={() => onOpenChange(false)} className={isMobile ? 'w-full' : ''} disabled={isSaving}>
            Cancel
          </Button>
          <Button 
            onClick={handleSaveChanges} 
            className={isMobile ? 'w-full' : ''} 
            disabled={isSaving}
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditProfileDialog;
