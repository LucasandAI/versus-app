
import React, { useState } from 'react';
import { Camera } from 'lucide-react';
import { useApp } from '@/context/AppContext';
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
import { toast } from "@/hooks/use-toast";
import { supabase } from '@/integrations/supabase/client';

interface CreateClubDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CreateClubDialog = ({ open, onOpenChange }: CreateClubDialogProps) => {
  const { createClub, currentUser } = useApp();
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogoUpload = async (file: File) => {
    if (!currentUser) return null;
    
    try {
      console.log('[CreateClubDialog] Starting logo upload');
      const fileExt = file.name.split('.').pop();
      const fileName = `${currentUser.id}-club-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('club-logos')
        .upload(filePath, file);
        
      if (uploadError) {
        throw uploadError;
      }
      
      const { data } = supabase.storage.from('club-logos').getPublicUrl(filePath);
      return data.publicUrl;
    } catch (error) {
      console.error('[CreateClubDialog] Error uploading logo:', error);
      return null;
    }
  };

  const handleCreateClub = async () => {
    if (!name.trim()) {
      toast({
        title: "Error",
        description: "Please enter a club name",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    try {
      // Upload logo if there's an image
      let logoUrl = '/placeholder.svg';
      if (image) {
        // Extract the file from data URL if needed
        const imageFile = await fetch(image)
          .then(res => res.blob())
          .then(blob => new File([blob], 'club-logo.png', { type: 'image/png' }))
          .catch(err => {
            console.error('[CreateClubDialog] Error converting image:', err);
            return null;
          });
          
        if (imageFile) {
          logoUrl = await handleLogoUpload(imageFile) || logoUrl;
        }
      }

      const clubData = {
        name: name.trim(),
        logo: logoUrl,
        bio: bio.trim() || `Welcome to ${name.trim()}! We're a group of passionate runners looking to challenge ourselves and improve together.`
      };

      const result = await createClub(clubData);
      
      if (result) {
        toast({
          title: "Success",
          description: `Your club "${name}" has been created!`,
        });
        
        // Reset form and close dialog
        setName("");
        setBio("");
        setImage(null);
        onOpenChange(false);
      }
    } catch (error) {
      console.error('[CreateClubDialog] Error creating club:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create club",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create Club</DialogTitle>
        </DialogHeader>
        <div className="space-y-6 py-4">
          <div className="flex flex-col items-center gap-4">
            <div 
              className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center cursor-pointer hover:bg-gray-200 transition-colors"
              onClick={() => document.getElementById('club-image')?.click()}
            >
              {image ? (
                <img 
                  src={image} 
                  alt="Club" 
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <Camera className="h-8 w-8 text-gray-400" />
              )}
            </div>
            <input
              id="club-image"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onload = (e) => setImage(e.target?.result as string);
                  reader.readAsDataURL(file);
                }
              }}
            />
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => document.getElementById('club-image')?.click()}
            >
              Upload Picture
            </Button>
          </div>

          <div className="space-y-2">
            <label htmlFor="name" className="text-sm font-medium">Club Name</label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter club name"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="bio" className="text-sm font-medium">Club Bio</label>
            <Textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell us about your club"
              className="resize-none"
            />
          </div>
        </div>
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)} 
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleCreateClub} 
            disabled={isLoading}
          >
            {isLoading ? 'Creating...' : 'Create Club'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CreateClubDialog;
