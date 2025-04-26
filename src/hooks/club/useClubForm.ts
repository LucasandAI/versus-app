
import { useState, useEffect } from 'react';
import { Club } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from "@/hooks/use-toast";
import { useApp } from '@/context/AppContext';

export const useClubForm = (club: Club, onClose: () => void) => {
  const { setSelectedClub, setCurrentUser } = useApp();
  const [name, setName] = useState(club.name);
  const [bio, setBio] = useState(club.bio || 'A club for enthusiastic runners');
  const [logoPreview, setLogoPreview] = useState(club.logo || '/placeholder.svg');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (club) {
      setName(club.name);
      setBio(club.bio || 'A club for enthusiastic runners');
      setLogoPreview(club.logo || '/placeholder.svg');
      setLogoFile(null);
    }
  }, [club]);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      const previewUrl = URL.createObjectURL(file);
      setLogoPreview(previewUrl);
    }
  };

  const uploadLogoIfNeeded = async () => {
    if (!logoFile) return club.logo;
    try {
      const ext = logoFile.name.split('.').pop();
      const logoPath = `${club.id}/${Date.now()}.${ext}`;

      const { data, error } = await supabase
        .storage
        .from('club-logos')
        .upload(logoPath, logoFile, { upsert: true });

      if (error) throw error;

      const { data: publicUrlData } = supabase
        .storage
        .from('club-logos')
        .getPublicUrl(logoPath);
        
      return publicUrlData?.publicUrl;
    } catch (error) {
      console.error('Logo upload error:', error);
      throw error;
    }
  };

  const updateAppState = (updatedClub: Club) => {
    // Update selectedClub state
    setSelectedClub(updatedClub);

    // Update club in currentUser.clubs array
    setCurrentUser(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        clubs: prev.clubs.map(c => 
          c.id === updatedClub.id ? updatedClub : c
        )
      };
    });
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast({
        title: "Error",
        description: "Club name cannot be empty",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const logoUrl = await uploadLogoIfNeeded();

      const updatedClub = {
        ...club,
        name: name.trim(),
        bio: bio.trim(),
        logo: logoUrl || club.logo,
      };

      const { error: updateError } = await supabase
        .from('clubs')
        .update({
          name: updatedClub.name,
          bio: updatedClub.bio,
          logo: updatedClub.logo,
        })
        .eq('id', club.id);

      if (updateError) throw updateError;

      // Update both selectedClub and currentUser.clubs after successful save
      updateAppState(updatedClub);

      toast({
        title: "Club Updated",
        description: "The club details have been updated.",
      });

      onClose();
    } catch (error) {
      console.error('Error updating club:', error);
      toast({
        title: "Error Updating Club",
        description: error instanceof Error ? error.message : "Something went wrong.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return {
    name,
    setName,
    bio,
    setBio,
    logoPreview,
    logoFile,
    loading,
    handleLogoChange,
    handleSave,
  };
};
