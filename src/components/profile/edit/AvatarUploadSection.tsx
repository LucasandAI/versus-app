
import React from 'react';
import { Upload } from "lucide-react";
import UserAvatar from "@/components/shared/UserAvatar";

interface AvatarUploadSectionProps {
  avatar: string;
  name: string;
  previewKey: number;
  onAvatarChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const AvatarUploadSection: React.FC<AvatarUploadSectionProps> = ({
  avatar,
  name,
  previewKey,
  onAvatarChange,
}) => {
  return (
    <div className="flex items-center gap-4">
      <div className="relative">
        <UserAvatar 
          name={name} 
          image={avatar}
          size="lg"
          key={`avatar-${previewKey}`}
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
          onChange={onAvatarChange}
        />
      </div>
      <div>
        <p className="text-sm text-gray-500">Click the icon to upload a new picture</p>
      </div>
    </div>
  );
};

export default AvatarUploadSection;
