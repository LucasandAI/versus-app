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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";
import { Save, Upload } from 'lucide-react';
import { Textarea } from "@/components/ui/textarea";
import { useApp } from '@/context/AppContext';
import { supabase } from '@/integrations/supabase/client';

interface EditClubDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  club: Club;
}

const EditClubDialog: React.FC<EditClubDialogProps> = ({ 
  open, 
  onOpenChange, 
  club 
}) => {
  const { setSelectedClub } = useApp();
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
    if (!logoFile) return club.logo;
    try {
      const ext = logoFile.name.split('.').pop();
      const logoPath = `${club.id}/${Date.now()}.${ext}`;

      const { data, error } = await supabase
        .storage
        .from('club-logos')
        .upload(logoPath, logoFile, { upsert: true });

      if (error) {
        throw new Error(error.message);
      }

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
      // 1. Upload logo if new file selected
      const logoUrl = await uploadLogoIfNeeded();

      // 2. Update club in DB
      const { error: updateError } = await supabase
        .from('clubs')
        .update({
          name: name.trim(),
          bio: bio.trim(),
          logo: logoUrl,
        })
        .eq('id', club.id);

      if (updateError) {
        throw new Error(updateError.message);
      }

      // 3. Create fresh updated club object
      const updatedClub: Club = {
        id: club.id,
        name: name.trim(),
        bio: bio.trim(),
        logo: logoUrl,
        division: club.division,
        tier: club.tier,
        elitePoints: club.elitePoints,
        members: club.members,
        matchHistory: club.matchHistory,
      };

      // 4. Update context with fresh club object
      setSelectedClub(updatedClub);

      toast({
        title: "Club Updated",
        description: "The club details have been updated.",
      });

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
          <DialogDescription>Make changes to your club's profile here.</DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <div className="space-y-6">
            <div className="flex flex-col items-center gap-3">
              <div className="relative">
                <img 
                  src={logoPreview} 
                  alt={name} 
                  className="h-24 w-24 rounded-full object-cover border"
                />
                <label 
                  htmlFor="logo-upload" 
                  className="absolute bottom-0 right-0 bg-primary text-white p-1.5 rounded-full cursor-pointer shadow-md"
                >
                  <Upload className="h-4 w-4" />
                  <span className="sr-only">Upload logo</span>
                </label>
                <input 
                  id="logo-upload" 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  onChange={handleLogoChange}
                />
              </div>
              <p className="text-xs text-gray-500">Click the icon to upload a new logo</p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="club-name">Club Name</Label>
              <Input 
                id="club-name" 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                placeholder="Enter club name"
                disabled={loading}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="club-bio">Club Bio</Label>
              <Textarea 
                id="club-bio" 
                value={bio} 
                onChange={(e) => setBio(e.target.value)} 
                placeholder="Enter club bio"
                rows={4}
                disabled={loading}
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" disabled={loading}>Cancel</Button>
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
