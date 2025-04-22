
import React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface BasicInfoSectionProps {
  name: string;
  setName: (value: string) => void;
  bio: string;
  setBio: (value: string) => void;
}

const BasicInfoSection: React.FC<BasicInfoSectionProps> = ({
  name,
  setName,
  bio,
  setBio
}) => {
  return (
    <>
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
    </>
  );
};

export default BasicInfoSection;
