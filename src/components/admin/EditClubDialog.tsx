
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
import LogoSection from './edit-club/LogoSection';
import ClubDetailsForm from './edit-club/ClubDetailsForm';

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
    loading,
    handleLogoChange,
    handleSave,
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
            <LogoSection
              name={name}
              logoPreview={logoPreview}
              handleLogoChange={handleLogoChange}
            />
            
            <ClubDetailsForm
              name={name}
              setName={setName}
              bio={bio}
              setBio={setBio}
              loading={loading}
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
