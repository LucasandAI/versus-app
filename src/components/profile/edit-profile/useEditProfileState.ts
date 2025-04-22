
import { useState, useEffect } from "react";
import { User } from "@/types";
import { toast } from "@/hooks/use-toast";
import { useApp } from "@/context/AppContext";
import { uploadAvatar } from "./uploadAvatar";

interface UseEditProfileStateProps {
  user: User | null;
  onOpenChange: (o: boolean) => void;
}

export const useEditProfileState = ({ user, onOpenChange }: UseEditProfileStateProps) => {
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
  }, [user]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const previewUrl = URL.createObjectURL(file);
      setAvatar(previewUrl);
      setAvatarFile(file);
      setPreviewKey(Date.now());
    }
  };

  const handleSaveChanges = async () => {
    if (!name.trim()) {
      toast({
        title: "Error",
        description: "Name cannot be empty",
        variant: "destructive",
      });
      return false;
    }

    if (!user) {
      toast({
        title: "Error",
        description: "No user found to update",
        variant: "destructive",
      });
      return false;
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

      const { safeSupabase } = await import('@/integrations/supabase/safeClient');
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

      if (error) throw error;

      // Update local state
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
      return true;
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Update Failed",
        description: "There was an error updating your profile. Please try again.",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  return {
    name, setName,
    bio, setBio,
    instagram, setInstagram,
    linkedin, setLinkedin,
    twitter, setTwitter,
    facebook, setFacebook,
    website, setWebsite,
    tiktok, setTiktok,
    avatar, setAvatar,
    avatarFile, setAvatarFile,
    previewKey,
    isSaving,
    handleAvatarChange,
    handleSaveChanges,
  };
};
