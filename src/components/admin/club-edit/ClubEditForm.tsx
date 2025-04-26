
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface ClubEditFormProps {
  name: string;
  bio: string;
  onNameChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBioChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  disabled?: boolean;
}

const ClubEditForm = ({
  name,
  bio,
  onNameChange,
  onBioChange,
  disabled
}: ClubEditFormProps) => {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="club-name">Club Name</Label>
        <Input 
          id="club-name" 
          value={name} 
          onChange={onNameChange} 
          placeholder="Enter club name"
          disabled={disabled}
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="club-bio">Club Bio</Label>
        <Textarea 
          id="club-bio" 
          value={bio} 
          onChange={onBioChange} 
          placeholder="Enter club bio"
          rows={4}
          disabled={disabled}
        />
      </div>
    </div>
  );
};

export default ClubEditForm;
