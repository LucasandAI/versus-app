
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
  const { setSelectedClub, setCurrentUser } = useApp();
  const [name, setName] = useState(club.name);
  const [bio, setBio] = useState(club.bio || 'A club for enthusiastic runners');
  const [logoPreview, setLogoPreview] = useState(club.logo || '/placeholder.svg');
  
  // Reset form when club or open state changes
  React.useEffect(() => {
    if (open && club) {
      setName(club.name);
      setBio(club.bio || 'A club for enthusiastic runners');
      setLogoPreview(club.logo || '/placeholder.svg');
    }
  }, [club, open]);
  
  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // In a real app, this would upload the file to a storage service
      // For now, we'll just create a temporary URL
      const previewUrl = URL.createObjectURL(file);
      setLogoPreview(previewUrl);
    }
  };

  const handleSave = () => {
    if (!name.trim()) {
      toast({
        title: "Error",
        description: "Club name cannot be empty",
        variant: "destructive",
      });
      return;
    }
    
    // Create an updated club with the new details
    const updatedClub = {
      ...club,
      name: name.trim(),
      bio: bio.trim(),
      logo: logoPreview
    };
    
    // Update the club in the context
    setSelectedClub(updatedClub);
    
    // Update the club in user's clubs list
    setCurrentUser(prev => {
      if (!prev) return prev;
      
      const updatedClubs = prev.clubs.map(userClub => {
        if (userClub.id === club.id) {
          return {
            ...userClub,
            name: name.trim(),
            bio: bio.trim(),
            logo: logoPreview
          };
        }
        return userClub;
      });
      
      return {
        ...prev,
        clubs: updatedClubs
      };
    });
    
    toast({
      title: "Club Updated",
      description: "The club details have been updated successfully.",
    });
    
    onOpenChange(false);
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
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button onClick={handleSave}>
            <Save className="mr-2 h-4 w-4" />
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditClubDialog;
