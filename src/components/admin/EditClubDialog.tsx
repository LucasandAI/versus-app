
import React from 'react';
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
import { useClubForm } from '@/hooks/club/useClubForm';
import LogoUploadSection from './club-edit/LogoUploadSection';
import ClubEditForm from './club-edit/ClubEditForm';

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
  const {
    name,
    setName,
    bio,
    setBio,
    logoPreview,
    handleLogoChange,
    handleSave,
    loading
  } = useClubForm(club, () => onOpenChange(false));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Club Details</DialogTitle>
          <DialogDescription>Make changes to your club's profile here.</DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <div className="space-y-6">
            <LogoUploadSection
              logoPreview={logoPreview}
              name={name}
              onLogoChange={handleLogoChange}
              disabled={loading}
            />
            
            <ClubEditForm
              name={name}
              bio={bio}
              onNameChange={(e) => setName(e.target.value)}
              onBioChange={(e) => setBio(e.target.value)}
              disabled={loading}
            />
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
