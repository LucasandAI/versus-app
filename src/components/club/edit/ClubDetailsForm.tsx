
import React from 'react';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface ClubDetailsFormProps {
  name: string;
  setName: (name: string) => void;
  bio: string;
  setBio: (bio: string) => void;
  loading: boolean;
}

const ClubDetailsForm: React.FC<ClubDetailsFormProps> = ({
  name,
  setName,
  bio,
  setBio,
  loading
}) => {
  return (
    <div className="space-y-6">
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
  );
};

export default ClubDetailsForm;
