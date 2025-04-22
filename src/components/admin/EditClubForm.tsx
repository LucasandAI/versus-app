
import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import EditClubLogoSection from "./EditClubLogoSection";

interface EditClubFormProps {
  name: string;
  setName: (v: string) => void;
  bio: string;
  setBio: (v: string) => void;
  logoPreview: string;
  clubName: string;
  onLogoChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  loading: boolean;
}

const EditClubForm: React.FC<EditClubFormProps> = ({
  name,
  setName,
  bio,
  setBio,
  logoPreview,
  clubName,
  onLogoChange,
  loading,
}) => (
  <div className="space-y-6">
    <EditClubLogoSection
      logoPreview={logoPreview}
      clubName={clubName}
      onLogoChange={onLogoChange}
      loading={loading}
    />
    <div className="space-y-2">
      <Label htmlFor="club-name">Club Name</Label>
      <Input
        id="club-name"
        value={name}
        onChange={e => setName(e.target.value)}
        placeholder="Enter club name"
        disabled={loading}
      />
    </div>
    <div className="space-y-2">
      <Label htmlFor="club-bio">Club Bio</Label>
      <Textarea
        id="club-bio"
        value={bio}
        onChange={e => setBio(e.target.value)}
        placeholder="Enter club bio"
        rows={4}
        disabled={loading}
      />
    </div>
  </div>
);

export default EditClubForm;
