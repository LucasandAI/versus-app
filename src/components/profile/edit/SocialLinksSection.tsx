
import React from 'react';
import { Input } from "@/components/ui/input";
import { Instagram, Linkedin, Globe, Twitter, Facebook } from "lucide-react";

interface SocialLinksSectionProps {
  instagram: string;
  linkedin: string;
  twitter: string;
  facebook: string;
  website: string;
  tiktok: string;
  onSocialChange: (field: string, value: string) => void;
}

const SocialLinksSection: React.FC<SocialLinksSectionProps> = ({
  instagram,
  linkedin,
  twitter,
  facebook,
  website,
  tiktok,
  onSocialChange,
}) => {
  return (
    <div className="space-y-4">
      <h4 className="text-sm font-medium">Social Links</h4>
      
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Instagram className="h-4 w-4" />
          <Input 
            placeholder="Instagram username" 
            value={instagram}
            onChange={(e) => onSocialChange('instagram', e.target.value)}
          />
        </div>
        
        <div className="flex items-center gap-2">
          <Twitter className="h-4 w-4" />
          <Input 
            placeholder="Twitter username" 
            value={twitter}
            onChange={(e) => onSocialChange('twitter', e.target.value)}
          />
        </div>
        
        <div className="flex items-center gap-2">
          <Facebook className="h-4 w-4" />
          <Input 
            placeholder="Facebook profile URL" 
            value={facebook}
            onChange={(e) => onSocialChange('facebook', e.target.value)}
          />
        </div>
        
        <div className="flex items-center gap-2">
          <Linkedin className="h-4 w-4" />
          <Input 
            placeholder="LinkedIn profile URL" 
            value={linkedin}
            onChange={(e) => onSocialChange('linkedin', e.target.value)}
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
            onChange={(e) => onSocialChange('tiktok', e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2">
          <Globe className="h-4 w-4" />
          <Input 
            placeholder="Website URL" 
            value={website}
            onChange={(e) => onSocialChange('website', e.target.value)}
          />
        </div>
      </div>
    </div>
  );
};

export default SocialLinksSection;
