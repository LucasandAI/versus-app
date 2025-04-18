
import React, { useState } from "react";
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
import { Instagram, Linkedin, Globe, Twitter, Facebook, Upload } from "lucide-react";
import UserAvatar from "@/components/shared/UserAvatar";
import { toast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { User } from "@/types";
import { useApp } from "@/context/AppContext";

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
  const isMobile = useIsMobile();

  // Reset form fields when user changes or dialog opens
  React.useEffect(() => {
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
    }
  }, [user, open]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // In a real app, this would upload the file to a storage service
      // For now, we'll just create a temporary URL
      const previewUrl = URL.createObjectURL(file);
      setAvatar(previewUrl);
    }
  };

  const handleSaveChanges = () => {
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
    
    // Update the current user with the new profile data
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
      avatar
    };
    
    // Update both currentUser and selectedUser if they're the same
    setCurrentUser(updatedUser);
    setSelectedUser(updatedUser);

    toast({
      title: "Profile Updated",
      description: "Your profile has been updated successfully",
    });
    
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={`${isMobile ? 'w-[95vw] max-w-[95vw]' : 'sm:max-w-[425px]'}`}>
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
        </DialogHeader>
        <div className="space-y-6 py-4">
          <div className="flex items-center gap-4">
            <div className="relative">
              <UserAvatar 
                name={user?.name || ""} 
                image={avatar}
                size="lg"
              />
              <label 
                htmlFor="avatar-upload" 
                className="absolute bottom-0 right-0 bg-primary text-white p-1.5 rounded-full cursor-pointer shadow-md"
              >
                <Upload className="h-4 w-4" />
                <span className="sr-only">Upload picture</span>
              </label>
              <input 
                id="avatar-upload" 
                type="file" 
                accept="image/*" 
                className="hidden" 
                onChange={handleAvatarChange}
              />
            </div>
            <div>
              <p className="text-sm text-gray-500">Click the icon to upload a new picture</p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell us about yourself"
              className="resize-none"
              rows={3}
            />
          </div>

          <div className="space-y-4">
            <h4 className="text-sm font-medium">Social Links</h4>
            
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Instagram className="h-4 w-4" />
                <Input 
                  placeholder="Instagram username" 
                  value={instagram}
                  onChange={(e) => setInstagram(e.target.value)}
                />
              </div>
              
              <div className="flex items-center gap-2">
                <Twitter className="h-4 w-4" />
                <Input 
                  placeholder="Twitter username" 
                  value={twitter}
                  onChange={(e) => setTwitter(e.target.value)}
                />
              </div>
              
              <div className="flex items-center gap-2">
                <Facebook className="h-4 w-4" />
                <Input 
                  placeholder="Facebook profile URL" 
                  value={facebook}
                  onChange={(e) => setFacebook(e.target.value)}
                />
              </div>
              
              <div className="flex items-center gap-2">
                <Linkedin className="h-4 w-4" />
                <Input 
                  placeholder="LinkedIn profile URL" 
                  value={linkedin}
                  onChange={(e) => setLinkedin(e.target.value)}
                />
              </div>

              <div className="flex items-center gap-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-4 w-4"
                >
                  <path d="M9 12A3 3 0 1 0 9 6a3 3 0 0 0 0 6Z" />
                  <path d="M9 6v12m6-6v6m0-9v3" />
                </svg>
                <Input 
                  placeholder="TikTok username" 
                  value={tiktok}
                  onChange={(e) => setTiktok(e.target.value)}
                />
              </div>

              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4" />
                <Input 
                  placeholder="Website URL" 
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>
        <DialogFooter className={`${isMobile ? 'flex-col gap-2' : ''}`}>
          <Button variant="outline" onClick={() => onOpenChange(false)} className={isMobile ? 'w-full' : ''}>
            Cancel
          </Button>
          <Button onClick={handleSaveChanges} className={isMobile ? 'w-full' : ''}>
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditProfileDialog;
