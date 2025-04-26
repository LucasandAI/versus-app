
import { useState } from 'react';
import { Club } from '@/types';
import { useApp } from '@/context/AppContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export const useClubForm = (club: Club, onClose: () => void) => {
  const { setSelectedClub, setCurrentUser } = useApp();
  const [name, setName] = useState(club.name);
  const [bio, setBio] = useState(club.bio || 'A club for enthusiastic runners');
  const [logoPreview, setLogoPreview] = useState(club.logo || '/placeholder.svg');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

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

      if (error) throw new Error(error.message);

      const { data: publicUrlData } = supabase
        .storage
        .from('club-logos')
        .getPublicUrl(logoPath);
        
      return publicUrlData?.publicUrl;
    } catch (e) {
      toast({
        title: "Logo Upload Failed",
        description: e instanceof Error ? e.message : "Error uploading logo.",
        variant: "destructive",
      });
      return club.logo || '/placeholder.svg';
    }
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
      const { error: updateError } = await supabase
        .from('clubs')
        .update({
          name: name.trim(),
          bio: bio.trim(),
          logo: logoUrl,
        })
        .eq('id', club.id);

      if (updateError) throw new Error(updateError.message);

      const updatedClub: Club = {
        ...club,
        name: name.trim(),
        bio: bio.trim(),
        logo: logoUrl,
      };

      setSelectedClub(updatedClub);
      setCurrentUser(prev => {
        if (!prev) return prev;
        const updatedClubs = prev.clubs.map(userClub =>
          userClub.id === club.id ? updatedClub : userClub
        );
        return { ...prev, clubs: updatedClubs };
      });

      toast({
        title: "Club Updated",
        description: "The club details have been updated.",
      });

      onClose();
    } catch (error) {
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
    handleLogoChange,
    handleSave,
    loading
  };
};
