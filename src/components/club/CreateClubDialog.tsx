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
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { supabase } from '@/lib/supabase';

interface CreateClubDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CreateClubDialog = ({ open, onOpenChange }: CreateClubDialogProps) => {
  const { createClub, currentUser } = useApp();
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [image, setImage] = useState<string | null>(null);

  const handleCreateClub = () => {
    if (!name.trim()) {
      toast({
        title: "Error",
        description: "Please enter a club name",
        variant: "destructive",
      });
      return;
    }

    createClub(
      name.trim(),
      image || '/placeholder.svg'
    );

    toast({
      title: "Success",
      description: "Your club has been created",
    });

    // Reset form
    setName("");
    setBio("");
    setImage(null);
    onOpenChange(false);
  };

  const handleLogoUpload = async (file: File) => {
    if (!currentUser) return null;
    
    try {
      console.log('[CreateClubDialog] Starting logo upload');
      const fileExt = file.name.split('.').pop();
      const fileName = `${currentUser.id}-club-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;
      
      // Fix the TypeScript error by removing the extra argument
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
            <Label htmlFor="name">Club Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter club name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">Club Bio</Label>
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
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleCreateClub}>
            Create Club
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CreateClubDialog;
