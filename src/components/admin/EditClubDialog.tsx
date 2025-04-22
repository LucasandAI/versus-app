
import React, { useState } from 'react';
import { Club } from '@/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
  DialogDescription
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Save } from 'lucide-react';
import { toast } from "@/components/ui/use-toast";
import { useApp } from '@/context/AppContext';
import { supabase } from '@/integrations/supabase/client';
import EditClubForm from './EditClubForm';

interface EditClubDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  club: Club;
  onClubUpdated?: () => void;
}

const EditClubDialog: React.FC<EditClubDialogProps> = ({
  open,
  onOpenChange,
  club,
  onClubUpdated
}) => {
  const { setSelectedClub, setCurrentUser } = useApp();
  const [name, setName] = useState(club.name);
  const [bio, setBio] = useState(club.bio || 'A club for enthusiastic runners');
  const [logoPreview, setLogoPreview] = useState(club.logo || '/placeholder.svg');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    if (open && club) {
      setName(club.name);
      setBio(club.bio || 'A club for enthusiastic runners');
      setLogoPreview(club.logo || '/placeholder.svg');
      setLogoFile(null);
    }
  }, [club, open]);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      const previewUrl = URL.createObjectURL(file);
      setLogoPreview(previewUrl);
    }
  };

  const uploadLogoIfNeeded = async () => {
    if (!logoFile) return club.logo; // no change
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

      // Optimistically update context (user's clubs and selected club)
      const updatedClub = {
        ...club,
        name: name.trim(),
        bio: bio.trim(),
        logo: logoUrl,
      };
      setSelectedClub(updatedClub);

      setCurrentUser(prev => {
        if (!prev) return prev;
        const updatedClubs = prev.clubs.map(userClub =>
          userClub.id === club.id
            ? { ...userClub, name: name.trim(), bio: bio.trim(), logo: logoUrl }
            : userClub
        );
        return { ...prev, clubs: updatedClubs };
      });

      toast({
        title: "Club Updated",
        description: "The club details have been updated.",
      });

      // Call the refresh function if provided
      if (onClubUpdated) {
        onClubUpdated();
      }
      onOpenChange(false);
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Club Details</DialogTitle>
          <DialogDescription>
            Make changes to your club's profile here.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <EditClubForm
            name={name}
            setName={setName}
            bio={bio}
            setBio={setBio}
            logoPreview={logoPreview}
            clubName={name}
            onLogoChange={handleLogoChange}
            loading={loading}
          />
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" disabled={loading}>
              Cancel
            </Button>
          </DialogClose>
          <Button onClick={handleSave} disabled={loading}>
            <Save className="mr-2 h-4 w-4" />
            {loading ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditClubDialog;
