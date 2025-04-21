
import { useState, useEffect } from 'react';
import { User } from '@/types';
import { toast } from '@/hooks/use-toast';
import { useApp } from '@/context/AppContext';

export interface ProfileFormState {
  name: string;
  bio: string;
  instagram: string;
  linkedin: string;
  twitter: string;
  facebook: string;
  website: string;
  tiktok: string;
  avatar: string;
  avatarFile: File | null;
  previewKey: number;
}

export const useProfileForm = (user: User | null, onSuccess: () => void) => {
  const { setCurrentUser, setSelectedUser } = useApp();
  const [formState, setFormState] = useState<ProfileFormState>({
    name: '',
    bio: 'Strava Athlete',
    instagram: '',
    linkedin: '',
    twitter: '',
    facebook: '',
    website: '',
    tiktok: '',
    avatar: '',
    avatarFile: null,
    previewKey: Date.now(),
  });

  useEffect(() => {
    if (user) {
      setFormState({
        name: user.name || '',
        bio: user.bio || 'Strava Athlete',
        instagram: user.instagram || '',
        twitter: user.twitter || '',
        facebook: user.facebook || '',
        linkedin: user.linkedin || '',
        website: user.website || '',
        tiktok: user.tiktok || '',
        avatar: user.avatar || '',
        avatarFile: null,
        previewKey: Date.now(),
      });
    }
  }, [user]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const previewUrl = URL.createObjectURL(file);
      setFormState(prev => ({
        ...prev,
        avatar: previewUrl,
        avatarFile: file,
        previewKey: Date.now(),
      }));
    }
  };

  const handleSocialChange = (field: string, value: string) => {
    setFormState(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleFormSubmit = () => {
    if (!formState.name.trim()) {
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
      name: formState.name,
      bio: formState.bio,
      instagram: formState.instagram,
      linkedin: formState.linkedin,
      twitter: formState.twitter,
      facebook: formState.facebook,
      website: formState.website,
      tiktok: formState.tiktok,
      avatar: formState.avatar
    };

    setCurrentUser(updatedUser);
    setSelectedUser(updatedUser);

    toast({
      title: "Profile Updated",
      description: "Your profile has been updated successfully",
    });

    onSuccess();
  };

  return {
    formState,
    setFormState,
    handleAvatarChange,
    handleSocialChange,
    handleFormSubmit,
  };
};
